const express = require('express');
const { parseJSON } = require('../helpers');

module.exports = function (pool) {
    const router = express.Router();

    // POST /api/chatbot/message (public — AI assistant)
    router.post('/message', async (req, res, next) => {
        try {
            const { message } = req.body;
            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Message is required' });
            }

            const userMsg = message.toLowerCase().trim();
            let reply = '';
            let products = [];
            let suggestions = [];

            // ──────────────────────────────
            // INTENT: Greeting
            // ──────────────────────────────
            if (/^(hi|hello|hey|good morning|good evening)/.test(userMsg)) {
                const storeName = await getSettingValue('store_name') || 'North Dry Fruits';
                reply = `Hello! 👋 Welcome to ${storeName}! I'm your shopping assistant. I can help you:\n\n• Find products & check prices\n• Browse categories\n• Check stock availability\n• Get shipping info\n• Track your order\n\nWhat are you looking for today?`;
                suggestions = ['Browse Products', 'Show Categories', 'Shipping Info', 'Track Order'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Order Tracking
            // ──────────────────────────────
            if (/track|order status|where.?s my order|my order/i.test(userMsg)) {
                reply = `📦 To track your order, visit our **Order Tracking** page and enter your Order ID and phone number.\n\n[Track Your Order →](/track-order)`;
                suggestions = ['Browse Products', 'Shipping Info'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Shipping / Delivery Info
            // ──────────────────────────────
            if (/shipping|delivery|deliver|ship|how long/i.test(userMsg)) {
                reply = `🚚 **Shipping Information:**\n\n• **Free shipping** on all orders — no delivery charges\n• Orders are processed within 1-2 business days\n• Estimated delivery: 3-5 business days\n\nWould you like to start shopping?`;
                suggestions = ['Browse Products', 'Track Order'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Payment Methods
            // ──────────────────────────────
            if (/payment|pay|easypaisa|jazzcash|bank|cod|cash on delivery/i.test(userMsg)) {
                // Build payment methods response dynamically from DB
                const [paymentAccounts] = await pool.query('SELECT DISTINCT method, title FROM payment_accounts WHERE is_active = 1');
                let methodLines = '• **Cash on Delivery (COD)** — Pay when your order arrives';
                const methodLabels = { 'easypaisa': 'Easypaisa', 'jazzcash': 'JazzCash', 'bank_transfer': 'Bank Transfer' };
                const seen = new Set();
                for (const acc of paymentAccounts) {
                    if (!seen.has(acc.method)) {
                        seen.add(acc.method);
                        const label = methodLabels[acc.method] || acc.title || acc.method;
                        methodLines += `\n• **${label}** — Send to our account & upload receipt`;
                    }
                }
                reply = `💳 **Payment Methods Available:**\n\n${methodLines}\n\nAll online payments are verified by our team within a few hours.`;
                suggestions = ['Browse Products', 'Shipping Info'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Show Categories
            // ──────────────────────────────
            if (/categor|what.?(do )?you (sell|have)|types|kinds|variety|varieties/i.test(userMsg)) {
                const [categories] = await pool.query('SELECT name, slug FROM categories ORDER BY name');
                if (categories.length > 0) {
                    const catList = categories.map(c => `• **${c.name}**`).join('\n');
                    reply = `🏷️ We have these categories:\n\n${catList}\n\nWould you like to see products in any of these?`;
                    suggestions = categories.slice(0, 4).map(c => c.name);
                } else {
                    reply = `We're still setting up our store. Check back soon!`;
                }
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Price Inquiry
            // ──────────────────────────────
            if (/price|cost|how much|rate/i.test(userMsg)) {
                const searchTerm = userMsg
                    .replace(/price|cost|how much|rate|of|the|is|for|what|what's/gi, '')
                    .trim();

                if (searchTerm.length >= 2) {
                    const results = await searchProducts(searchTerm);
                    if (results.length > 0) {
                        products = results.slice(0, 3);
                        const currency = await getSettingValue('currency_symbol') || '$';
                        const priceInfo = products.map(p => {
                            const options = p.weight_options || [];
                            const priceList = options.map(o => `${o.label}: ${currency} ${o.price.toLocaleString()}`).join(' | ');
                            return `**${p.name}**: ${priceList || `${currency} ${p.base_price.toLocaleString()}`}`;
                        }).join('\n\n');
                        reply = `💰 Here are the prices:\n\n${priceInfo}`;
                        suggestions = ['Browse Products', 'Add to Cart'];
                    } else {
                        reply = `I couldn't find pricing for "${searchTerm}". Try searching with a different keyword, or browse our full shop.`;
                        suggestions = ['Browse Products', 'Show Categories'];
                    }
                } else {
                    reply = `Which product's price would you like to know? Try asking like "price of almonds" or "how much are walnuts?"`;
                    suggestions = ['Price of Almonds', 'Price of Walnuts', 'Show Categories'];
                }
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Stock Check
            // ──────────────────────────────
            if (/stock|available|in stock|do you have|availability|milega/i.test(userMsg)) {
                const searchTerm = userMsg
                    .replace(/stock|available|in stock|do you have|availability|milega|is|the|of|any|check/gi, '')
                    .trim();

                if (searchTerm.length >= 2) {
                    const results = await searchProducts(searchTerm);
                    if (results.length > 0) {
                        products = results.slice(0, 3);
                        const stockInfo = products.map(p =>
                            `**${p.name}**: ${p.stock > 0 ? `✅ In Stock (${p.stock} available)` : '❌ Out of Stock'}`
                        ).join('\n');
                        reply = `📦 Stock Status:\n\n${stockInfo}`;
                        suggestions = ['Browse Products'];
                    } else {
                        reply = `I couldn't find "${searchTerm}" in our inventory. Try a different keyword.`;
                        suggestions = ['Browse Products', 'Show Categories'];
                    }
                } else {
                    reply = `Which product's stock would you like to check? Try "is almonds available?" or "stock of pine nuts".`;
                    suggestions = ['Show Categories', 'Browse Products'];
                }
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Featured / Best Sellers
            // ──────────────────────────────
            if (/best|popular|top|featured|recommend|suggestion|best seller/i.test(userMsg)) {
                const [featuredRows] = await pool.query(`
                    SELECT p.*, c.name as category_name, c.slug as category_slug 
                    FROM products p LEFT JOIN categories c ON p.category_id = c.id 
                    WHERE (p.is_deleted IS NULL OR p.is_deleted = 0) AND p.is_featured = 1 
                    ORDER BY p.rating DESC LIMIT 4
                `);
                const featured = featuredRows.map(p => ({ ...p, weight_options: parseJSON(p.weight_options) }));

                if (featured.length > 0) {
                    products = featured;
                    reply = `⭐ Here are our best-selling products:`;
                } else {
                    reply = `We're updating our featured products. Check our shop for the latest!`;
                }
                suggestions = ['Show Categories', 'Shipping Info'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Help / What can you do
            // ──────────────────────────────
            if (/help|what can you|how to|guide|support/i.test(userMsg)) {
                reply = `🤝 I can help you with:\n\n• **Find Products** — Just type a product name like "almonds" or "dates"\n• **Check Prices** — Ask "price of walnuts"\n• **Check Stock** — Ask "is pine nuts available?"\n• **Browse Categories** — Ask "show categories"\n• **Shipping Info** — Ask about delivery and shipping\n• **Payment Methods** — Ask about payment options\n• **Track Order** — Get a link to track your order\n\nJust type what you need!`;
                suggestions = ['Browse Products', 'Show Categories', 'Shipping Info', 'Track Order'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // INTENT: Thank you / Goodbye
            // ──────────────────────────────
            if (/thank|thanks|shukria|bye|goodbye|ok|great|awesome/i.test(userMsg)) {
                reply = `You're welcome! 😊 Feel free to ask if you need anything else. Happy shopping! 🛍️`;
                suggestions = ['Browse Products', 'Track Order'];
                return res.json({ reply, products, suggestions });
            }

            // ──────────────────────────────
            // FALLBACK: Product Search
            // ──────────────────────────────
            if (userMsg.length >= 2) {
                const results = await searchProducts(userMsg);
                if (results.length > 0) {
                    products = results.slice(0, 4);
                    reply = `🔍 I found ${results.length} product${results.length > 1 ? 's' : ''} matching "${message}":`;
                    suggestions = ['Show Categories', 'Shipping Info'];
                    return res.json({ reply, products, suggestions });
                }
            }

            // ──────────────────────────────
            // FINAL FALLBACK
            // ──────────────────────────────
            reply = `I'm not sure I understood that. Here are some things I can help with:\n\n• Search for products (e.g., "almonds", "dates")\n• Check prices (e.g., "price of walnuts")\n• Browse categories\n• Shipping & delivery info\n• Track your order\n\nTry one of the options below! 👇`;
            suggestions = ['Browse Products', 'Show Categories', 'Shipping Info', 'Track Order'];
            return res.json({ reply, products, suggestions });

        } catch (error) {
            next(error);
        }
    });

    // Helper: search products (now async)
    async function searchProducts(term) {
        const words = term.split(/\s+/).filter(w => w.length >= 2);
        if (words.length === 0) return [];

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p LEFT JOIN categories c ON p.category_id = c.id 
            WHERE (p.is_deleted IS NULL OR p.is_deleted = 0)
        `;
        const params = [];

        // Match any word in name, description, or category
        const conditions = words.map(() => '(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
        query += ' AND (' + conditions.join(' OR ') + ')';
        words.forEach(w => {
            params.push(`%${w}%`, `%${w}%`, `%${w}%`);
        });

        query += ' ORDER BY p.is_featured DESC, p.rating DESC LIMIT 6';

        const [rows] = await pool.query(query, params);
        return rows.map(p => ({
            ...p,
            weight_options: parseJSON(p.weight_options)
        }));
    }

    // Helper: get setting value (now async)
    async function getSettingValue(key) {
        const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', [key]);
        return rows.length > 0 ? rows[0].value : null;
    }

    return router;
};
