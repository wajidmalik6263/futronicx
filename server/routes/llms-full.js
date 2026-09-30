const express = require('express');
const { LOCATION_SEO } = require('../utils/locationSeo');

// Serves /llms-full.txt — a companion to /llms.txt that provides deep,
// full-text content for AI models that want to ingest detailed product
// descriptions, blog summaries, and policy text. This helps AI assistants
// give accurate, specific answers about the store's products and policies.
//
// Spec reference: the llms.txt proposal recommends llms-full.txt for sites
// that want to provide more than just a directory listing to AI crawlers.
module.exports = function (pool) {
    const router = express.Router();

    let cache = null;
    let cacheAt = 0;
    const TTL = 60 * 60 * 1000; // 1 hour

    const money = (currency, n) => {
        const num = Number(n);
        if (!Number.isFinite(num)) return null;
        return `${currency}${num.toLocaleString()}`;
    };

    const stripHtml = (s) =>
        String(s || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/\s+/g, ' ')
            .trim();

    const build = async () => {
        // --- settings ---
        const s = {};
        try {
            const [rows] = await pool.query(
                "SELECT `key`, value FROM settings WHERE `key` IN ('site_url','store_name','store_tagline','currency_symbol','currency_code','free_shipping_threshold','default_shipping_fee','return_window_days','contact_email','contact_phone','contact_address','working_hours','about_text')"
            );
            for (const r of rows) s[r.key] = r.value;
        } catch { /* fall through */ }

        const storeName = s.store_name || 'North Dry Fruits';
        const tagline = s.store_tagline || 'Premium organic dry fruits & nuts from Gilgit-Baltistan';
        const currency = s.currency_symbol || 'Rs ';
        const site = (s.site_url || 'https://northdryfruits.com').replace(/\/$/, '');
        const returnDays = Number(s.return_window_days) || 7;

        const L = [];
        L.push(`# ${storeName} — Full Content`);
        L.push('');
        L.push(`> ${storeName} is an online store offering ${tagline.toLowerCase()}, sourced from Gilgit-Baltistan, Pakistan and delivered fresh across the country.`);
        L.push('');
        L.push('This document provides detailed product descriptions, blog content, and policy information for AI assistants.');
        L.push('');

        // --- Key Facts ---
        L.push('## Key Facts');
        L.push('');
        L.push(`- Store name: ${storeName}`);
        L.push('- Sourcing: Gilgit-Baltistan (northern Pakistan)');
        L.push('- Delivery: nationwide across Pakistan');
        L.push('- Shipping: completely free on all orders — no delivery charges');
        L.push('- Dispatch: orders typically dispatched within 24 hours; delivery in 2–3 business days');
        L.push(`- Returns: ${returnDays}-day return window with free returns`);
        L.push('- Payment methods: Cash on Delivery (COD), Easypaisa, JazzCash, Bank Transfer');
        if (s.contact_email) L.push(`- Contact email: ${s.contact_email}`);
        if (s.contact_phone) L.push(`- Contact phone: ${s.contact_phone}`);
        if (s.contact_address) L.push(`- Address: ${s.contact_address}`);
        if (s.working_hours) L.push(`- Working hours: ${s.working_hours}`);
        L.push('');

        // --- Full Product Catalog ---
        let products = [];
        try {
            const [rows] = await pool.query(`
                SELECT p.name, p.slug, p.base_price, p.description, p.origin,
                       p.stock, p.weight_options, c.name AS category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE (p.is_deleted IS NULL OR p.is_deleted = 0)
                ORDER BY p.is_featured DESC, c.name ASC, p.name ASC
            `);
            products = rows;
        } catch { products = []; }

        if (products.length) {
            L.push('## Complete Product Catalog');
            L.push('');

            for (const p of products) {
                if (!p.slug || !p.name) continue;
                const price = Number(p.base_price) > 0 ? money(currency, p.base_price) : '';
                const availability = p.stock > 0 ? 'In Stock' : 'Out of Stock';

                L.push(`### ${p.name}`);
                L.push('');
                if (price) L.push(`- **Price:** from ${price}`);
                if (p.category_name) L.push(`- **Category:** ${p.category_name}`);
                if (p.origin) L.push(`- **Origin:** ${p.origin}`);
                L.push(`- **Availability:** ${availability}`);
                L.push(`- **Link:** [${p.name}](${site}/product/${p.slug})`);

                // Weight options
                let options = p.weight_options;
                if (typeof options === 'string') {
                    try { options = JSON.parse(options); } catch { options = null; }
                }
                if (Array.isArray(options) && options.length > 0) {
                    const optionList = options
                        .filter((o) => o.label && Number(o.price) > 0)
                        .map((o) => `${o.label}: ${money(currency, o.price)}`)
                        .join(', ');
                    if (optionList) L.push(`- **Weight options:** ${optionList}`);
                }

                // Full description
                if (p.description) {
                    const desc = stripHtml(p.description);
                    if (desc.length > 20) {
                        L.push('');
                        L.push(desc.length > 800 ? desc.slice(0, 800) + '…' : desc);
                    }
                }
                L.push('');
            }
        }

        // --- Blog Articles ---
        let blogs = [];
        try {
            const [rows] = await pool.query(`
                SELECT b.title, b.slug, b.excerpt, b.content, b.created_at,
                       bc.name AS category_name
                FROM blogs b
                LEFT JOIN blog_categories bc ON b.category_id = bc.id
                WHERE b.is_published = 1
                ORDER BY b.created_at DESC
                LIMIT 30
            `);
            blogs = rows;
        } catch { blogs = []; }

        if (blogs.length) {
            L.push('## Blog Articles');
            L.push('');

            for (const b of blogs) {
                if (!b.slug || !b.title) continue;
                L.push(`### ${b.title}`);
                L.push('');
                if (b.category_name) L.push(`- **Category:** ${b.category_name}`);
                if (b.created_at) L.push(`- **Published:** ${new Date(b.created_at).toISOString().split('T')[0]}`);
                L.push(`- **Link:** [${b.title}](${site}/blog/${b.slug})`);

                if (b.excerpt) {
                    L.push('');
                    L.push(`> ${stripHtml(b.excerpt)}`);
                }

                if (b.content) {
                    const content = stripHtml(b.content);
                    if (content.length > 50) {
                        L.push('');
                        L.push(content.length > 1200 ? content.slice(0, 1200) + '…' : content);
                    }
                }
                L.push('');
            }
        }

        // --- Regions ---
        const locSlugs = Object.keys(LOCATION_SEO);
        if (locSlugs.length) {
            L.push('## Regions');
            L.push('');
            for (const slug of locSlugs) {
                const loc = LOCATION_SEO[slug];
                L.push(`### ${loc.h1}`);
                L.push('');
                if (loc.intro) {
                    for (const para of loc.intro) L.push(para);
                    L.push('');
                }
                if (loc.faqs && loc.faqs.length) {
                    for (const faq of loc.faqs) {
                        L.push(`**Q: ${faq.q}**`);
                        L.push(`A: ${faq.a}`);
                        L.push('');
                    }
                }
                L.push(`- **Link:** [${loc.h1}](${site}/${slug})`);
                L.push('');
            }
        }

        // --- Policies ---
        L.push('## Shipping & Delivery Policy');
        L.push('');
        L.push('- Free shipping on all orders across Pakistan — no minimum order required.');
        L.push('- Orders are dispatched within 24 hours of confirmation.');
        L.push('- Standard delivery takes 2–3 business days nationwide.');
        L.push('- Payment is accepted via Cash on Delivery (COD), Easypaisa, JazzCash, and bank transfer.');
        L.push('');
        L.push('## Return Policy');
        L.push('');
        L.push(`- ${returnDays}-day return window from the date of delivery.`);
        L.push('- Returns are free — no return shipping charges.');
        L.push('- Contact customer support via email or phone to initiate a return.');
        L.push('- Refunds are processed within 3–5 business days after receiving the returned item.');
        L.push('');

        L.push('## Links');
        L.push('');
        L.push(`- [Home](${site}/)`);
        L.push(`- [Products](${site}/products)`);
        L.push(`- [Blog](${site}/blog)`);
        L.push(`- [About](${site}/about)`);
        L.push(`- [Contact](${site}/contact)`);
        L.push(`- [FAQ](${site}/faq)`);
        L.push(`- [Shipping & Delivery](${site}/shipping)`);
        L.push(`- [Privacy Policy](${site}/privacy)`);
        L.push(`- [Sitemap](${site}/sitemap.xml)`);
        L.push('');

        return L.join('\n');
    };

    router.get('/', async (req, res, next) => {
        try {
            const now = Date.now();
            if (!cache || now - cacheAt > TTL) {
                try {
                    cache = await build();
                    cacheAt = now;
                } catch {
                    return res.status(404).type('text/plain').send('llms-full.txt not available');
                }
            }
            res.header('Content-Type', 'text/markdown; charset=utf-8');
            res.header('Cache-Control', 'public, max-age=3600');
            return res.send(cache);
        } catch (error) {
            next(error);
        }
    });

    return router;
};
