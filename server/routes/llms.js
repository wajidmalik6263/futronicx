const express = require('express');
const fs = require('fs');
const path = require('path');
const { parseJSON } = require('../helpers');
const { LOCATION_SEO } = require('../utils/locationSeo');

// Serves /llms.txt with an explicit text/markdown content-type.
//
// Registered BEFORE express.static and the SPA catch-all so the request never
// falls through to index.html (which would return HTML and cause agentic
// browsing audits to report "Fetch of llms.txt failed" / "does not follow
// recommendations"). The llms.txt spec expects a Markdown document with at
// least one H1 header.
//
// This version is DYNAMIC: it builds the document from the live database
// (store settings, categories, price ranges, top products, policies) so the
// facts an LLM quotes stay current with the catalog. If the DB is unavailable
// it falls back to the hand-written static file (client/public/llms.txt, or
// the built copy in client/dist/llms.txt), and finally to a minimal document.
module.exports = function (pool) {
    const router = express.Router();

    const staticPaths = [
        path.join(__dirname, '..', '..', 'client', 'public', 'llms.txt'),
        path.join(__dirname, '..', '..', 'client', 'dist', 'llms.txt'),
    ];

    // Simple in-memory cache — the catalog changes rarely relative to crawl rate.
    let cache = null;
    let cacheAt = 0;
    const TTL = 60 * 60 * 1000; // 1 hour

    const readStaticFallback = () => {
        const filePath = staticPaths.find((p) => fs.existsSync(p));
        if (!filePath) return null;
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch {
            return null;
        }
    };

    const money = (currency, n) => {
        const num = Number(n);
        if (!Number.isFinite(num)) return null;
        return `${currency}${num.toLocaleString()}`;
    };

    const build = async () => {
        // --- settings -------------------------------------------------
        const s = {};
        try {
            const [rows] = await pool.query(
                "SELECT `key`, value FROM settings WHERE `key` IN ('site_url','store_name','store_tagline','currency_symbol','currency_code','free_shipping_threshold','default_shipping_fee','return_window_days','contact_email','contact_phone','contact_address','working_hours')"
            );
            for (const r of rows) s[r.key] = r.value;
        } catch {
            // fall through — build with defaults
        }

        const storeName = s.store_name || 'North Dry Fruits';
        const tagline = s.store_tagline || 'Premium organic dry fruits & nuts from Gilgit-Baltistan';
        const currency = s.currency_symbol || 'Rs ';
        const site = (s.site_url || 'https://northdryfruits.com').replace(/\/$/, '');

        // --- categories with product counts + price ranges ------------
        let categories = [];
        try {
            const [rows] = await pool.query(`
                SELECT c.name, c.slug,
                       COUNT(p.id) AS product_count,
                       MIN(p.base_price) AS min_price,
                       MAX(p.base_price) AS max_price
                FROM categories c
                LEFT JOIN products p
                  ON p.category_id = c.id AND (p.is_deleted IS NULL OR p.is_deleted = 0)
                GROUP BY c.id, c.name, c.slug
                ORDER BY c.name ASC
            `);
            categories = rows;
        } catch {
            categories = [];
        }

        // --- a handful of featured/top products for concrete examples --
        let topProducts = [];
        try {
            const [rows] = await pool.query(`
                SELECT p.name, p.slug, p.base_price, p.origin, c.name AS category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE (p.is_deleted IS NULL OR p.is_deleted = 0)
                ORDER BY p.is_featured DESC, p.rating DESC
                LIMIT 12
            `);
            topProducts = rows;
        } catch {
            topProducts = [];
        }

        // --- overall catalog price range ------------------------------
        const prices = categories
            .flatMap((c) => [Number(c.min_price), Number(c.max_price)])
            .filter((n) => Number.isFinite(n) && n > 0);
        const catalogMin = prices.length ? Math.min(...prices) : null;
        const catalogMax = prices.length ? Math.max(...prices) : null;

        // --- policy summary -------------------------------------------
        const returnDays = Number(s.return_window_days) || 7;

        // --- assemble markdown ----------------------------------------
        const L = [];
        L.push(`# ${storeName}`);
        L.push('');
        L.push(`> ${storeName} is an online store offering ${tagline.toLowerCase()}, sourced from Gilgit-Baltistan, Pakistan and delivered fresh across the country.`);
        L.push('');
        L.push(`${storeName} sells natural products with weight-based pricing (e.g. 250g, 500g, 1kg). The site supports browsing by category, product search, cart and checkout, order tracking, and multiple payment methods including Cash on Delivery, Easypaisa, JazzCash and bank transfer.`);
        if (catalogMin != null && catalogMax != null) {
            L.push('');
            L.push(`Product prices range from ${money(currency, catalogMin)} to ${money(currency, catalogMax)} depending on the item and selected weight.`);
        }
        L.push('');

        // Key facts block — the stuff an assistant is most likely to be asked.
        L.push('## Key facts');
        L.push('');
        L.push(`- Store name: ${storeName}`);
        L.push('- Sourcing: Gilgit-Baltistan (northern Pakistan)');
        L.push('- Delivery: nationwide across Pakistan');
        L.push('- Shipping: completely free on all orders — no delivery charges');
        L.push('- Dispatch: orders typically dispatched within 24 hours; delivery in 2–3 business days');
        L.push(`- Returns: ${returnDays}-day return window`);
        L.push('- Payment methods: Cash on Delivery (COD), Easypaisa, JazzCash, Bank Transfer');
        if (s.contact_email) L.push(`- Contact email: ${s.contact_email}`);
        if (s.contact_phone) L.push(`- Contact phone: ${s.contact_phone}`);
        if (s.working_hours) L.push(`- Working hours: ${s.working_hours}`);
        L.push('');

        // Categories with counts + ranges.
        if (categories.length) {
            L.push('## Product categories');
            L.push('');
            for (const c of categories) {
                if (!c.slug || !c.name) continue;
                const count = Number(c.product_count) || 0;
                let range = '';
                if (Number(c.min_price) > 0 && Number(c.max_price) > 0) {
                    range = Number(c.min_price) === Number(c.max_price)
                        ? ` — from ${money(currency, c.min_price)}`
                        : ` — ${money(currency, c.min_price)}–${money(currency, c.max_price)}`;
                }
                const countLabel = count > 0 ? ` (${count} product${count > 1 ? 's' : ''})` : '';
                L.push(`- [${c.name}](${site}/products/${c.slug})${countLabel}${range}`);
            }
            L.push('');
        }

        // Concrete product examples help an assistant answer "what do you sell".
        if (topProducts.length) {
            L.push('## Popular products');
            L.push('');
            for (const p of topProducts) {
                if (!p.slug || !p.name) continue;
                const price = Number(p.base_price) > 0 ? ` — from ${money(currency, p.base_price)}` : '';
                const origin = p.origin ? ` (origin: ${p.origin})` : '';
                L.push(`- [${p.name}](${site}/product/${p.slug})${price}${origin}`);
            }
            L.push('');
        }

        // Main navigation pages.
        L.push('## Main pages');
        L.push('');
        L.push(`- [Home](${site}/): Featured products, categories and current offers.`);
        L.push(`- [Products](${site}/products): Full catalog of dry fruits, nuts and natural products with filtering.`);
        L.push(`- [About](${site}/about): Company story, sourcing and quality commitment.`);
        L.push(`- [Contact](${site}/contact): Ways to reach customer support.`);
        L.push(`- [Track Order](${site}/track-order): Look up the status of a placed order.`);
        L.push(`- [Blog](${site}/blog): Articles on nutrition, recipes and product guides.`);
        L.push(`- [Guides](${site}/guides): Guides and articles on dry fruits, nuts and origins.`);
        L.push(`- [FAQ](${site}/faq): Answers about ordering, sourcing, shipping, payment and returns.`);
        L.push(`- [Shipping & Delivery](${site}/shipping): Delivery areas, times, costs, payment and returns.`);
        L.push('');

        // Region landing pages — help assistants map products to their region.
        const locSlugs = Object.keys(LOCATION_SEO);
        if (locSlugs.length) {
            L.push('## Regions');
            L.push('');
            for (const slug of locSlugs) {
                const loc = LOCATION_SEO[slug];
                L.push(`- [${loc.h1}](${site}/${slug}): ${loc.description}`);
            }
            L.push('');
        }

        L.push('## Policies');
        L.push('');
        L.push(`- [Privacy Policy](${site}/privacy): Privacy practices, terms of service and refund policy.`);
        L.push('');

        L.push('## Optional');
        L.push('');
        L.push(`- [Sitemap](${site}/sitemap.xml): Machine-readable list of all indexable URLs.`);
        L.push(`- [Full Content](${site}/llms-full.txt): Complete product descriptions, blog articles, and policies for AI assistants.`);
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
                    // Building failed — use the static fallback but do NOT cache it
                    // so the next request retries the dynamic build.
                    const fallback = readStaticFallback();
                    if (fallback) {
                        res.header('Content-Type', 'text/markdown; charset=utf-8');
                        res.header('Cache-Control', 'public, max-age=600');
                        return res.send(fallback);
                    }
                    return res.status(404).type('text/plain').send('llms.txt not found');
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
