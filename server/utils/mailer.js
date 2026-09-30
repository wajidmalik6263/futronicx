/**
 * F3: Email notification utility using Nodemailer.
 * Sends order confirmation emails when SMTP is configured.
 * 
 * Required .env variables:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@email.com
 *   SMTP_PASS=your_app_password
 *   SMTP_FROM="Store <noreply@example.com>"
 * 
 * If SMTP is not configured, emails are silently skipped (logged only).
 */
const nodemailer = require('nodemailer');

let transporter = null;

function initMailer() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: parseInt(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('[Mailer] SMTP configured:', process.env.SMTP_HOST);
    } else {
        console.log('[Mailer] SMTP not configured — email notifications disabled.');
    }
}

/**
 * Send an order confirmation email to the customer.
 * Silently fails if SMTP is not configured or email is not provided.
 */
async function sendOrderConfirmation(order, items) {
    if (!transporter || !order.customer_email) return;

    // Read dynamic settings from DB
    const db = require('../db/db');
    let storeName = 'North Dry Fruits', currency = '$', orderPrefix = 'ORD';
    try {
        const nameRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('store_name');
        const currRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('currency_symbol');
        const prefixRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('order_id_prefix');
        storeName = nameRow?.value || 'North Dry Fruits';
        currency = currRow?.value || '$';
        orderPrefix = prefixRow?.value || 'ORD';
    } catch { /* use defaults */ }

    const itemRows = items.map(i =>
        `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${i.product_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${i.weight_option}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${currency} ${(i.price * i.quantity).toLocaleString()}</td>
        </tr>`
    ).join('');

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#3A2E1F">
        <div style="background:#3A2E1F;color:#F5A623;padding:20px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:24px">Order Confirmed! 🎉</h1>
        </div>
        <div style="padding:24px;border:1px solid #E8DEC8;border-top:none;border-radius:0 0 12px 12px">
            <p>Dear <strong>${order.customer_name}</strong>,</p>
            <p>Thank you for your order! Here's your order summary:</p>
            
            <div style="background:#F5EFE0;padding:12px;border-radius:8px;margin:16px 0">
                <strong>Order ID:</strong> ${orderPrefix}-${order.id}<br>
                <strong>Payment:</strong> ${order.payment_method || 'Cash on Delivery'}
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                    <tr style="background:#F5EFE0">
                        <th style="padding:8px;text-align:left">Product</th>
                        <th style="padding:8px;text-align:left">Weight</th>
                        <th style="padding:8px;text-align:center">Qty</th>
                        <th style="padding:8px;text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>

            <div style="margin-top:16px;padding:12px;background:#F5EFE0;border-radius:8px;text-align:right">
                <div>Subtotal: ${currency} ${(order.subtotal || order.total).toLocaleString()}</div>
                <div>Shipping: ${(order.shipping_fee || 0) === 0 ? 'FREE' : `${currency} ${order.shipping_fee}`}</div>
                <div style="font-size:18px;font-weight:bold;color:#D97706;margin-top:8px">
                    Total: ${currency} ${order.total.toLocaleString()}
                </div>
            </div>

            <div style="margin-top:16px;padding:12px;border:1px solid #E8DEC8;border-radius:8px">
                <strong>Delivery Address:</strong><br>
                ${order.address}
            </div>

            <p style="margin-top:24px;color:#666;font-size:12px">
                You will receive updates when your order is shipped. For any queries, reply to this email.
            </p>
        </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"${storeName}" <${process.env.SMTP_USER}>`,
            to: order.customer_email,
            subject: `Order Confirmed — ${orderPrefix}-${order.id}`,
            html,
        });
        console.log(`[Mailer] Order confirmation sent to ${order.customer_email} for order ${order.id}`);
    } catch (err) {
        console.error(`[Mailer] Failed to send email for order ${order.id}:`, err.message);
        // Don't throw — email failure should never block the order
    }
}

module.exports = { initMailer, sendOrderConfirmation };
