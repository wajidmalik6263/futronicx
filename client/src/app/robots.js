// Next.js robots route -> serves /robots.txt from the Next server.
// Mirrors the rules the Express backend used (server/routes/robots.js): the
// public storefront is fully crawlable; only private/transactional/API routes
// are disallowed. Points crawlers at the Next-generated sitemap.
import { SITE_ORIGIN } from '../lib/site';

export default function robots() {
  const disallow = [
    '/admin/',
    '/admin',
    '/api/',
    '/cart',
    '/wishlist',
    '/checkout',
    '/order-confirmation',
    '/track-order',
    // Thin/duplicate internal search & sort result URLs; canonical is the clean listing.
    '/*?*search=',
    '/*?*sort=',
    '/*?*q=',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // AI / LLM crawlers (GEO) explicitly welcomed, same surface.
      ...[
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
        'Google-Extended', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
        'Applebot-Extended', 'Bytespider', 'CCBot', 'meta-externalagent',
      ].map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/admin/', '/admin', '/api/', '/cart', '/wishlist', '/checkout', '/order-confirmation', '/track-order'],
      })),
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
