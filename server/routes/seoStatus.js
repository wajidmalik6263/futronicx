const express = require('express');

/**
 * SEO: SOFT-404 GUARD
 * ------------------------------------------------------------------
 * The SPA catch-all serves index.html with HTTP 200 for every path,
 * including URLs that point to a product / category / blog slug that
 * does not exist. Google treats a "not found" page returned with a
 * 200 status as a SOFT 404 and penalises / drops it from the index.
 *
 * This middleware inspects the small set of DB-backed detail routes and,
 * when the requested slug does not resolve to a real record, sets the
 * response status to 404 BEFORE the catch-all sends the SPA shell. The
 * React app still renders its normal NotFound UI (same index.html), but
 * crawlers now receive an honest 404 status line.
 *
 * Only known dynamic detail patterns are validated. Static routes
 * (/about, /contact, ...) and truly unknown top-level paths are handled
 * by React Router's own `*` NotFound route, which we also flag as 404
 * via the fallthrough at the end.
 *
 * Fail-open: if the DB lookup throws we do NOT force a 404 (better to
 * serve a 200 SPA shell than to hide a real page during a DB blip).
 */
const { LOCATION_SEO } = require('../utils/locationSeo');

module.exports = function (pool) {
    const router = express.Router();

    // Reserved top-level segments that are real SPA routes (not slugs to
    // validate here). Anything matching these is left to the SPA/React Router.
    // Location landing-page slugs (/dry-fruits-*) are pulled from LOCATION_SEO
    // so this list stays in sync with the pages that actually exist.
    const KNOWN_TOP_LEVEL = new Set([
        '', 'products', 'product', 'blog', 'cart', 'wishlist', 'checkout',
        'order-confirmation', 'about', 'contact', 'privacy', 'terms',
        'track-order', 'admin', 'api', 'uploads',
        'faq', 'shipping', 'guides',
        ...Object.keys(LOCATION_SEO),
    ]);

    const markNotFound = (res) => res.status(404);

    // /product/:slug  -> must exist (and not be soft-deleted) in products
    router.use('/product/:slug', async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                'SELECT 1 FROM products WHERE slug = ? AND (is_deleted IS NULL OR is_deleted = 0) LIMIT 1',
                [req.params.slug]
            );
            if (rows.length === 0) markNotFound(res);
        } catch {
            // fail-open: leave status as 200
        }
        next();
    });

    // /products/:category -> must exist in categories
    router.use('/products/:category', async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                'SELECT 1 FROM categories WHERE slug = ? LIMIT 1',
                [req.params.category]
            );
            if (rows.length === 0) markNotFound(res);
        } catch {
            // fail-open
        }
        next();
    });

    // /blog/:slug -> resolves to EITHER a blog category OR a published post
    // (mirrors the client BlogSlugRouter). Note: /blog, /blog/page/:n and
    // /blog/:slug/page/:n are valid listing routes and must NOT be flagged.
    router.use('/blog/:slug', async (req, res, next) => {
        // Skip pagination + listing sub-paths ("/blog/page/2" hits :slug="page").
        if (req.params.slug === 'page') return next();
        try {
            const [cat] = await pool.query(
                'SELECT 1 FROM blog_categories WHERE slug = ? LIMIT 1',
                [req.params.slug]
            );
            if (cat.length > 0) return next();

            const [post] = await pool.query(
                'SELECT 1 FROM blogs WHERE slug = ? AND is_published = 1 LIMIT 1',
                [req.params.slug]
            );
            if (post.length === 0) markNotFound(res);
        } catch {
            // fail-open
        }
        next();
    });

    // Unknown TOP-LEVEL single-segment paths (e.g. /random-thing) are real
    // 404s handled by React Router's `*` route -> flag the status too.
    router.use('/:segment', (req, res, next) => {
        if (!KNOWN_TOP_LEVEL.has(req.params.segment)) {
            markNotFound(res);
        }
        next();
    });

    return router;
};
