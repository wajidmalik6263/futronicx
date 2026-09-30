const express = require('express');
const { getLocationSeo } = require('../utils/locationSeo');

/**
 * LOCATION LANDING PAGES API
 * ------------------------------------------------------------------
 * GET /api/locations/:slug
 *   Returns the hand-written SEO copy for a region page (title, H1, intro,
 *   FAQs) PLUS the products that are ACTUALLY sourced from that region.
 *
 * Products are matched on their own `origin` text using the region's
 * `originMatch` terms (case-insensitive LIKE). This means a product only
 * appears under a region if its stored origin says so — we never fabricate
 * a product's origin. When no product matches, the page still renders as an
 * informational region page (empty products array).
 *
 * 404 for unknown slugs so the client can render its NotFound UI.
 */
module.exports = function (pool) {
    const router = express.Router();

    router.get('/:slug', async (req, res, next) => {
        const seo = getLocationSeo(req.params.slug);
        if (!seo) {
            return res.status(404).json({ error: 'Location not found' });
        }

        let products = [];
        try {
            const terms = Array.isArray(seo.originMatch) ? seo.originMatch : [];
            if (terms.length) {
                // Build "origin LIKE ? OR origin LIKE ? ..." safely with params.
                const clause = terms.map(() => 'LOWER(p.origin) LIKE ?').join(' OR ');
                const params = terms.map((t) => `%${String(t).toLowerCase()}%`);
                const [rows] = await pool.query(
                    `SELECT p.id, p.name, p.slug, p.origin, p.base_price, p.image_url,
                            p.rating, p.review_count, p.stock,
                            c.name AS category_name, c.slug AS category_slug
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE (p.is_deleted IS NULL OR p.is_deleted = 0)
                       AND p.origin IS NOT NULL AND p.origin != ''
                       AND (${clause})
                     ORDER BY p.is_featured DESC, p.id DESC
                     LIMIT 60`,
                    params
                );
                products = rows;
            }
        } catch (err) {
            // Fail-open: return the page copy without products rather than 500.
            products = [];
        }

        res.json({
            slug: req.params.slug,
            region: seo.region,
            title: seo.title,
            description: seo.description,
            h1: seo.h1,
            intro: seo.intro,
            faqs: seo.faqs,
            products,
        });
    });

    return router;
};
