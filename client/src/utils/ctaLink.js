// Normalizes CTA/link values coming from the homepage config (stored in the DB
// and edited via the admin panel). Older content may still point at the legacy
// "/shop" path, which no longer exists — the products listing lives at
// "/products". This keeps those buttons working without needing a data edit.
export function normalizeCtaLink(link) {
    if (!link || typeof link !== 'string') return link;

    // Match "/shop", "/shop/", "/shop/anything", "/shop?query" — but not paths
    // that merely start with the word "shop" (e.g. "/shopping-guide").
    if (/^\/shop(\/|\?|#|$)/i.test(link)) {
        return link.replace(/^\/shop/i, '/products');
    }

    return link;
}
