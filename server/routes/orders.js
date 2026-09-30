const express = require('express');
const { parseJSON } = require('../helpers');
const { getWhatsAppLink } = require('../services/whatsappService');

module.exports = function (pool, requireAdmin, broadcastToAdmins) {
    const router = express.Router();

    // GET /api/orders/track (public — order tracking by ID + phone)
    router.get('/track', async (req, res, next) => {
        try {
            const { order_id, phone } = req.query;

            if (!order_id || !phone) {
                return res.status(400).json({ error: 'Order ID and phone number are required' });
            }

            // Support multiple formats:
            // - Raw numeric: "4", "12"
            // - Prefixed: "ORD-4", "#ORD-4", "GB-4"
            // - With year: "UD-2026-5", "#UD-2026-5"
            let numericId = order_id.trim().replace(/^#/, '');

            // Match PREFIX-YEAR-NUMBER (e.g. "UD-2026-5")
            const refWithYear = numericId.match(/^[A-Za-z]+-\d{4}-(\d+)$/);
            if (refWithYear) {
                numericId = refWithYear[1];
            }
            // Match PREFIX-NUMBER (e.g. "ORD-4", "GB-12")
            else {
                const refSimple = numericId.match(/^[A-Za-z]+-(\d+)$/);
                if (refSimple) {
                    numericId = refSimple[1];
                }
                // If still not a pure number, extract trailing digits as fallback
                else if (!/^\d+$/.test(numericId)) {
                    const digits = numericId.match(/(\d+)$/);
                    numericId = digits ? digits[1] : numericId;
                }
            }

            const [orderRows] = await pool.query('SELECT id, customer_name, phone, status, total, subtotal, shipping_fee, payment_method, payment_status, created_at FROM orders WHERE id = ?', [numericId]);
            if (orderRows.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            const order = orderRows[0];

            // Verify phone matches (strip non-digits for flexible comparison)
            const cleanInputPhone = phone.replace(/\D/g, '');
            const cleanOrderPhone = (order.phone || '').replace(/\D/g, '');

            // Compare full numbers, or last 10 digits for flexibility
            const inputLast10 = cleanInputPhone.slice(-10);
            const orderLast10 = cleanOrderPhone.slice(-10);
            if (cleanInputPhone !== cleanOrderPhone && inputLast10 !== orderLast10) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Use the resolved order.id (not the raw order_id param) to fetch items
            const [items] = await pool.query('SELECT product_name, weight_option, quantity, price FROM order_items WHERE order_id = ?', [order.id]);

            res.json({
                id: order.id,
                customer_name: order.customer_name,
                status: order.status,
                total: order.total,
                subtotal: order.subtotal,
                shipping_fee: order.shipping_fee,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                created_at: order.created_at,
                items
            });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/orders (admin — F2: search/filter support)
    router.get('/', requireAdmin, async (req, res, next) => {
        try {
            const { status, search, from, to } = req.query;

            let query = 'SELECT * FROM orders WHERE 1=1';
            const params = [];

            if (status && status !== 'All') {
                query += ' AND status = ?';
                params.push(status);
            }
            if (search) {
                query += ' AND (customer_name LIKE ? OR phone LIKE ? OR CAST(id AS CHAR) LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (from) {
                query += ' AND created_at >= ?';
                params.push(from);
            }
            if (to) {
                query += ' AND created_at <= ?';
                params.push(to + ' 23:59:59');
            }

            query += ' ORDER BY created_at DESC';

            const [orders] = await pool.query(query, params);
            const [allItems] = await pool.query('SELECT * FROM order_items');

            const itemsByOrderId = {};
            for (const item of allItems) {
                if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
                itemsByOrderId[item.order_id].push(item);
            }

            const ordersWithItems = orders.map(order => ({
                ...order,
                items: itemsByOrderId[order.id] || []
            }));

            res.json(ordersWithItems);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/orders (public — B1: server-side price lookup, B2: server-side shipping, B5: atomic stock)
    router.post('/', async (req, res, next) => {
        try {
            const { customer_name, customer_email, phone, address, payment_method, items, payment_proof } = req.body;

            if (!customer_name || !phone || !address) {
                return res.status(400).json({ error: 'Customer name, phone, and address are required' });
            }
            if (!items || !items.length) {
                return res.status(400).json({ error: 'Order must contain at least one item' });
            }

            const conn = await pool.getConnection();
            let result;
            try {
                await conn.beginTransaction();

                let serverSubtotal = 0;
                const validatedItems = [];

                for (const item of items) {
                    const [productRows] = await conn.query('SELECT id, name, stock, base_price, weight_options FROM products WHERE id = ?', [item.product_id]);
                    if (productRows.length === 0) {
                        throw new Error(`Product with ID ${item.product_id} not found`);
                    }
                    const product = productRows[0];

                    let serverPrice = product.base_price;
                    const weightOptions = parseJSON(product.weight_options);
                    if (weightOptions && item.weight_option) {
                        const matchedOption = weightOptions.find(opt => opt.label === item.weight_option);
                        if (matchedOption) {
                            serverPrice = matchedOption.price;
                        }
                    }

                    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

                    const [stockResult] = await conn.query('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [quantity, product.id, quantity]);
                    if (stockResult.affectedRows === 0) {
                        const [freshRows] = await conn.query('SELECT stock FROM products WHERE id = ?', [item.product_id]);
                        throw new Error(`Insufficient stock for "${product.name}". Available: ${freshRows.length > 0 ? freshRows[0].stock : 0}, Requested: ${quantity}`);
                    }

                    serverSubtotal += serverPrice * quantity;
                    validatedItems.push({
                        product_id: product.id,
                        product_name: product.name,
                        weight_option: item.weight_option || 'Standard',
                        quantity: quantity,
                        price: serverPrice
                    });
                }

                // Shipping is always free — no charges on any order.
                const shippingFee = 0;
                const grandTotal = serverSubtotal + shippingFee;

                const payMethod = payment_method || 'COD';
                const paymentStatus = payMethod === 'COD' ? 'Unpaid' : (payment_proof ? 'Pending Verification' : 'Unpaid');

                const [orderResult] = await conn.query(`
                    INSERT INTO orders (customer_name, customer_email, phone, address, subtotal, shipping_fee, total, payment_method, payment_proof, payment_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    customer_name, customer_email || null, phone, address,
                    serverSubtotal, shippingFee, grandTotal,
                    payMethod, payment_proof || null, paymentStatus
                ]);
                const orderId = orderResult.insertId;

                for (const item of validatedItems) {
                    await conn.query(`
                        INSERT INTO order_items (order_id, product_id, product_name, weight_option, quantity, price)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [orderId, item.product_id, item.product_name, item.weight_option, item.quantity, item.price]);
                }

                await conn.commit();

                result = { orderId, grandTotal, validatedItems, customerEmail: customer_email, customerName: customer_name };
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            // F3: Send email notification (fire-and-forget)
            const orderSummary = { id: result.orderId, customer_name, customer_email, phone, address, total: result.grandTotal, payment_method: payment_method || 'COD' };
            try {
                const { sendOrderConfirmation, sendAdminNotification } = require('../services/emailService');
                if (customer_email) sendOrderConfirmation(orderSummary, result.validatedItems);
                sendAdminNotification(orderSummary, result.validatedItems);
            } catch (emailErr) {
                // Email is optional — don't fail the order
                console.log('[Email] Skipped:', emailErr.message);
            }

            // Send WhatsApp notification to admin (fire-and-forget)
            try {
                const { sendOrderWhatsApp } = require('../services/whatsappService');
                sendOrderWhatsApp(orderSummary, result.validatedItems);
            } catch (waErr) {
                // WhatsApp is optional — don't fail the order
                console.log('[WhatsApp] Skipped:', waErr.message);
            }

            // WebSocket: Notify admin panel of new order
            try {
                broadcastToAdmins('new_order', {
                    id: result.orderId,
                    customer_name,
                    customer_email: customer_email || null,
                    phone,
                    address,
                    total: result.grandTotal,
                    status: 'Pending',
                    payment_method: payment_method || 'COD',
                    created_at: new Date().toISOString(),
                    items: result.validatedItems
                });
            } catch (wsErr) {
                console.log('[WebSocket] Broadcast skipped:', wsErr.message);
            }

            res.status(201).json({ id: result.orderId, message: 'Order created successfully' });
        } catch (error) {
            if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    });

    // PATCH /api/orders/:id/status (admin — B4: enforces status transitions)
    router.patch('/:id/status', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }

            const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
            if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
            const order = orderRows[0];

            const validTransitions = {
                'Pending': ['Processing', 'Cancelled'],
                'Processing': ['Shipped', 'Cancelled'],
                'Shipped': ['Delivered', 'Cancelled'],
                'Delivered': [],
                'Cancelled': []
            };

            const allowed = validTransitions[order.status] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({
                    error: `Cannot transition from "${order.status}" to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
                });
            }

            if (status === 'Cancelled' && order.status !== 'Cancelled') {
                const conn = await pool.getConnection();
                try {
                    await conn.beginTransaction();
                    const [orderItems] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
                    for (const item of orderItems) {
                        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                    }
                    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
                    await conn.commit();
                } catch (err) {
                    await conn.rollback();
                    throw err;
                } finally {
                    conn.release();
                }
            } else {
                await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
            }

            // Send email notification (fire-and-forget)
            try {
                const { sendOrderStatusEmail } = require('../services/emailService');
                sendOrderStatusEmail(order, status);
            } catch (emailErr) {
                console.log('[Email] Status notification skipped:', emailErr.message);
            }

            // WebSocket: Notify admin panel of status change
            try {
                broadcastToAdmins('order_status_updated', {
                    id: Number(id),
                    status,
                    previous_status: order.status
                });
            } catch (wsErr) {
                console.log('[WebSocket] Broadcast skipped:', wsErr.message);
            }

            // Generate WhatsApp link for admin
            const whatsappLink = await getWhatsAppLink(order.phone, order, status);

            res.json({
                message: 'Order status updated successfully',
                whatsappLink
            });
        } catch (error) {
            next(error);
        }
    });

    // PATCH /api/orders/:id/payment (admin — verify or reject payment proof)
    router.patch('/:id/payment', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { payment_status } = req.body;

            const validStatuses = ['Pending Verification', 'Verified', 'Rejected'];
            if (!validStatuses.includes(payment_status)) {
                return res.status(400).json({ error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` });
            }

            const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
            if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
            const order = orderRows[0];

            await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, id]);

            // Send payment status email to customer (fire-and-forget)
            try {
                const { sendPaymentStatusEmail } = require('../services/emailService');
                sendPaymentStatusEmail(order, payment_status);
            } catch (emailErr) {
                console.log('[Email] Payment notification skipped:', emailErr.message);
            }

            // WebSocket: Notify admin panel of payment update
            try {
                broadcastToAdmins('payment_status_updated', {
                    id: Number(id),
                    payment_status
                });
            } catch (wsErr) {
                console.log('[WebSocket] Broadcast skipped:', wsErr.message);
            }

            res.json({ message: `Payment status updated to ${payment_status}` });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
