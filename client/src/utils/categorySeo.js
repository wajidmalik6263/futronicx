// ---------------------------------------------------------------------------
// Category SEO metadata
// ---------------------------------------------------------------------------
// Unique, hand-written title / meta-description / H1 copy for the primary
// product categories. Anything not listed here falls back to a sensible
// generated template so newly-added categories still get valid metadata and
// a unique H1 without a code change.
// Keys are the lowercase category slug.
//
// IMPORTANT: server/utils/categorySeo.js is a CommonJS MIRROR of this file and
// is used by the server-side "light prerender" (server/routes/prerender.js).
// Keep both files in sync so JS and non-JS crawlers see identical category meta.
// ---------------------------------------------------------------------------

const CATEGORY_SEO = {
    apricots: {
        title: 'Premium Dried Apricots Online in Pakistan',
        description:
            'Buy premium quality dried apricots online in Pakistan. Fresh, natural and authentic apricots sourced from the northern regions of Pakistan.',
        h1: 'Premium Dried Apricots',
    },
    almonds: {
        title: 'Premium Almonds Online in Pakistan',
        description:
            'Buy premium quality almonds online in Pakistan. Fresh, crunchy and hand-sorted almonds sourced from the northern regions of Pakistan.',
        h1: 'Premium Almonds',
    },
    walnuts: {
        title: 'Premium Walnuts Online in Pakistan',
        description:
            'Buy premium quality walnuts online in Pakistan. Fresh, natural kernels sourced directly from the northern regions of Pakistan.',
        h1: 'Premium Walnuts',
    },
    cashews: {
        title: 'Premium Cashews Online in Pakistan',
        description:
            'Buy premium quality cashews online in Pakistan. Fresh, creamy and lightly roasted cashews sourced from trusted growers.',
        h1: 'Premium Cashews',
    },
    herbs: {
        title: 'Natural Herbs Online in Pakistan',
        description:
            'Buy natural, authentic herbs online in Pakistan. Carefully harvested and dried herbs sourced from the northern regions of Pakistan.',
        h1: 'Natural Herbs',
    },
    tea: {
        title: 'Premium Tea Online in Pakistan',
        description:
            'Buy premium quality tea online in Pakistan. Aromatic, natural blends sourced from the northern regions of Pakistan.',
        h1: 'Premium Tea',
    },
    berries: {
        title: 'Premium Dried Berries Online in Pakistan',
        description:
            'Buy premium quality dried berries online in Pakistan. Fresh, natural and antioxidant-rich berries sourced from the northern regions of Pakistan.',
        h1: 'Premium Dried Berries',
    },
};

/**
 * Returns SEO metadata for a category page.
 *
 * @param {string} slug        The category slug from the URL (e.g. "apricots").
 * @param {string} [name]      The human-readable category name from the API
 *                             (used to build a nice fallback when the slug is
 *                             not in the hand-written map above).
 * @returns {{ title: string, description: string, h1: string }}
 */
export function getCategorySeo(slug, name) {
    const key = (slug || '').toLowerCase();
    if (CATEGORY_SEO[key]) return CATEGORY_SEO[key];

    // Fallback: build a unique, readable title from the category name (or slug).
    const label =
        name ||
        key
            .split('-')
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ') ||
        'Products';

    return {
        title: `${label} Online in Pakistan`,
        description: `Buy premium quality ${label.toLowerCase()} online in Pakistan. Fresh, natural and authentic ${label.toLowerCase()} sourced from the northern regions of Pakistan.`,
        h1: label,
    };
}

export default getCategorySeo;
