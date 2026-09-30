const express = require('express');

module.exports = function (pool) {
    const router = express.Router();

    router.get('/', async (req, res, next) => {
        try {
            let siteUrl = 'https://northdryfruits.com';
            try {
                const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', ['site_url']);
                if (rows.length > 0 && rows[0].value) siteUrl = rows[0].value;
            } catch (dbErr) {
                // DB unavailable in production must NOT cause robots.txt to fall
                // through to the SPA catch-all (which would serve HTML). Fall back
                // to the default site URL and still emit valid robots.txt.
                console.error('[robots.txt] settings lookup failed, using default site_url:', dbErr.message);
            }
            const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;

            // Public storefront is fully crawlable. Only private, transactional,
            // and backend routes are disallowed. Canonicalization of query/legacy
            // URLs (e.g. /products?category=x -> /products/x) is handled via
            // 301 redirects + <link rel="canonical">, NOT robots.txt, so Google
            // can still follow those redirects and consolidate ranking signals.
            let content = '';
            content += 'User-agent: *\n';
            content += 'Allow: /\n';
            content += '\n';
            content += '# Private admin area (also behind authentication)\n';
            content += 'Disallow: /admin/\n';
            content += 'Disallow: /admin\n';
            content += '\n';
            content += '# Backend API endpoints - not indexable content\n';
            content += 'Disallow: /api/\n';
            content += '\n';
            content += '# Transactional / user-specific pages with no search value\n';
            content += 'Disallow: /cart\n';
            content += 'Disallow: /wishlist\n';
            content += 'Disallow: /checkout\n';
            content += 'Disallow: /order-confirmation\n';
            content += 'Disallow: /track-order\n';
            content += '\n';
            content += '# Internal site-search & sort result URLs (thin/duplicate; canonical is the clean listing)\n';
            content += 'Disallow: /*?*search=\n';
            content += 'Disallow: /*?*sort=\n';
            content += 'Disallow: /*?*q=\n';
            content += '\n';

            // AI / LLM crawlers (GEO): explicitly welcomed so the storefront can
            // surface in ChatGPT, Perplexity, Gemini, Claude and AI Overviews.
            // Same allow/disallow surface as the generic rules above. Listing
            // them by name documents the intent and makes it easy to tighten a
            // single agent later (e.g. block training but allow live retrieval).
            const aiAgents = [
                'GPTBot',          // OpenAI (training + search)
                'OAI-SearchBot',   // OpenAI ChatGPT search
                'ChatGPT-User',    // OpenAI on-demand browsing
                'PerplexityBot',   // Perplexity index
                'Perplexity-User', // Perplexity on-demand fetch
                'Google-Extended', // Google Gemini / AI training
                'ClaudeBot',       // Anthropic crawler
                'Claude-Web',      // Anthropic on-demand fetch
                'anthropic-ai',    // Anthropic (legacy token)
                'Applebot-Extended', // Apple Intelligence
                'Bytespider',      // ByteDance
                'CCBot',           // Common Crawl (feeds many LLMs)
                'meta-externalagent', // Meta AI
            ];
            for (const agent of aiAgents) {
                content += `User-agent: ${agent}\n`;
                content += 'Allow: /\n';
                content += 'Disallow: /admin/\n';
                content += 'Disallow: /admin\n';
                content += 'Disallow: /api/\n';
                content += 'Disallow: /cart\n';
                content += 'Disallow: /wishlist\n';
                content += 'Disallow: /checkout\n';
                content += 'Disallow: /order-confirmation\n';
                content += 'Disallow: /track-order\n';
                content += '\n';
            }

            content += `Sitemap: ${baseUrl}/sitemap.xml\n`;

            res.header('Content-Type', 'text/plain');
            res.send(content);
        } catch (error) {
            next(error);
        }
    });

    return router;
};
