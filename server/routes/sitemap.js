const express = require('express');
const { LOCATION_SEO } = require('../utils/locationSeo');

// Escape the five XML-significant characters so image URLs (which routinely
// contain `&` from CDN query strings) and any other field produce valid XML.
function escapeXml(unsafe) {
    return String(unsafe).replace(/[<>&'"]/g, (c) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
    }[c]));
}

module.exports = function (pool) {
    const router = express.Router();

    router.get('/', async (req, res, next) => {
        try {
            // Retrieve dynamic site URL from settings
            const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', ['site_url']);

            // Fall back to actual request host if site_url is not configured
            const fallbackUrl = req.protocol + '://' + req.get('host');
            const siteUrl = (rows.length > 0 && rows[0].value) ? rows[0].value : fallbackUrl;

            // Normalize trailing slash
            const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;

            // Static pages get a `lastmod` of "today" so crawlers see a fresh
            // signal on every fetch (these pages are effectively evergreen and
            // may change with any deploy). Format: YYYY-MM-DD.
            const today = new Date().toISOString().split('T')[0];

            const pages = [
                { url: `${baseUrl}/`, changefreq: 'daily', priority: 1.0, lastmod: today },
                { url: `${baseUrl}/products`, changefreq: 'daily', priority: 0.9, lastmod: today },
                { url: `${baseUrl}/blog`, changefreq: 'weekly', priority: 0.7, lastmod: today },
                { url: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.6, lastmod: today },
                { url: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.6, lastmod: today },
                { url: `${baseUrl}/faq`, changefreq: 'monthly', priority: 0.7, lastmod: today },
                { url: `${baseUrl}/shipping`, changefreq: 'monthly', priority: 0.6, lastmod: today },
                { url: `${baseUrl}/guides`, changefreq: 'weekly', priority: 0.7, lastmod: today },
                { url: `${baseUrl}/track-order`, changefreq: 'monthly', priority: 0.6, lastmod: today },
                { url: `${baseUrl}/privacy`, changefreq: 'yearly', priority: 0.5, lastmod: today }
            ];

            // Region landing pages (/dry-fruits-*) — evergreen, high-value for
            // GEO/location search. Pulled from LOCATION_SEO so this stays in sync
            // with the pages that actually exist.
            for (const slug of Object.keys(LOCATION_SEO)) {
                pages.push({
                    url: `${baseUrl}/${slug}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: today,
                });
            }

            // Product category listing pages: /products/:slug
            const [categories] = await pool.query('SELECT slug FROM categories ORDER BY name ASC');

            for (const c of categories) {
                if (!c.slug) continue;
                pages.push({
                    url: `${baseUrl}/products/${c.slug}`,
                    changefreq: 'daily',
                    priority: 0.8
                });
            }

            const [products] = await pool.query('SELECT slug, name, image_url, created_at FROM products WHERE (is_deleted IS NULL OR is_deleted = 0)');

            for (const p of products) {
                // If created_at is present, use a default fallback
                const date = p.created_at ? new Date(p.created_at) : new Date();
                pages.push({
                    url: `${baseUrl}/product/${p.slug}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: date.toISOString().split('T')[0],
                    // Google Image sitemap extension: helps product photos get
                    // discovered/indexed in Google Images. Only absolute http(s)
                    // URLs are valid here; skip relative/empty values.
                    image: (p.image_url && /^https?:\/\//i.test(p.image_url)) ? p.image_url : null,
                    // image:title gives the crawler a human-readable label for the
                    // photo (the product name), improving image understanding.
                    imageTitle: p.name || null
                });
            }

            // Blog category listing pages: /blog/:slug (page 1 only — canonical).
            // Paginated category/index pages (/page/N) are intentionally excluded
            // from the sitemap; they are crawlable via rel=next links but only the
            // clean root category URL is submitted as the canonical entry point.
            const [blogCategories] = await pool.query(`
                SELECT bc.slug, COUNT(b.id) AS blogCount
                FROM blog_categories bc
                LEFT JOIN blogs b ON b.category_id = bc.id AND b.is_published = 1
                GROUP BY bc.id, bc.slug
            `);

            for (const c of blogCategories) {
                if (!c.slug || !c.blogCount) continue; // skip empty categories
                pages.push({
                    url: `${baseUrl}/blog/${c.slug}`,
                    changefreq: 'weekly',
                    priority: 0.6
                });
            }

            // Individual published blog posts
            const [blogs] = await pool.query(
                'SELECT slug, updated_at, created_at FROM blogs WHERE is_published = 1'
            );

            for (const b of blogs) {
                const date = b.updated_at || b.created_at
                    ? new Date(b.updated_at || b.created_at)
                    : new Date();
                pages.push({
                    url: `${baseUrl}/blog/${b.slug}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                    lastmod: date.toISOString().split('T')[0]
                });
            }

            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
            xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

            for (const page of pages) {
                xml += '  <url>\n';
                xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
                if (page.lastmod) {
                    xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
                }
                xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
                xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
                if (page.image) {
                    xml += '    <image:image>\n';
                    xml += `      <image:loc>${escapeXml(page.image)}</image:loc>\n`;
                    if (page.imageTitle) {
                        xml += `      <image:title>${escapeXml(page.imageTitle)}</image:title>\n`;
                    }
                    xml += '    </image:image>\n';
                }
                xml += '  </url>\n';
            }
            xml += '</urlset>';

            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } catch (error) {
            next(error);
        }
    });

    return router;
};
