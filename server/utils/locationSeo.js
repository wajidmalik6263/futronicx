// ---------------------------------------------------------------------------
// Location landing-page SEO metadata (SERVER MIRROR)
// ---------------------------------------------------------------------------
// CommonJS mirror of client/src/utils/locationSeo.js. Both files MUST stay in
// sync so the server-side "light prerender" (routes/prerender.js) emits EXACTLY
// the same <title>/description/H1/intro/FAQ copy that the React LocationPage
// renders after hydration.
//
// These pages describe the region and link to products that are ACTUALLY
// sourced from it (matched via a product's `origin` field using `originMatch`).
// Regional facts below are general, well-documented horticultural facts about
// the area — they do NOT claim a specific product's origin. Per-product origin
// is only ever asserted from the product's own `origin` value.
//
// Keys are the URL path WITHOUT the leading slash (e.g. "dry-fruits-skardu").
// ---------------------------------------------------------------------------

const LOCATION_SEO = {
    'dry-fruits-pakistan': {
        region: 'Pakistan',
        title: 'Dry Fruits in Pakistan — Buy Premium Nuts & Dried Fruits Online',
        description:
            'Buy premium dry fruits, nuts and dried fruits online in Pakistan. Sourced from the northern regions and delivered fresh nationwide.',
        h1: 'Dry Fruits in Pakistan',
        intro: [
            'Pakistan is known for high-quality dry fruits, nuts and dried fruits, many of them grown in the northern mountain regions such as Gilgit-Baltistan.',
            'Popular Pakistani dry fruits include walnuts, almonds, dried apricots (khubani), dried mulberries, pine nuts (chilgoza) and raisins.',
            'You can buy these online and have them delivered fresh across Pakistan, typically within 2–3 business days.',
        ],
        // Matches products from anywhere in the northern supply regions.
        originMatch: ['pakistan', 'gilgit', 'baltistan', 'skardu', 'hunza'],
        faqs: [
            {
                q: 'What are the best dry fruits in Pakistan?',
                a: 'Commonly sought Pakistani dry fruits include walnuts, almonds, dried apricots, dried mulberries, pine nuts (chilgoza) and raisins, many grown in the northern regions.',
            },
            {
                q: 'Where can I buy dry fruits online in Pakistan?',
                a: 'You can buy dry fruits online from North Dry Fruits, with nationwide delivery across Pakistan and multiple payment methods including Cash on Delivery.',
            },
            {
                q: 'Where are Pakistan\u2019s dry fruits grown?',
                a: 'Many are grown in the northern mountain regions, including Gilgit-Baltistan and valleys such as Skardu, Hunza and Gilgit.',
            },
        ],
    },
    'dry-fruits-gilgit-baltistan': {
        region: 'Gilgit-Baltistan',
        title: 'Dry Fruits from Gilgit-Baltistan — Apricots, Walnuts & Almonds',
        description:
            'Dry fruits from Gilgit-Baltistan: apricots, walnuts, almonds and more from high-altitude northern orchards. Buy online with delivery across Pakistan.',
        h1: 'Dry Fruits from Gilgit-Baltistan',
        intro: [
            'Gilgit-Baltistan, in northern Pakistan, is a well-known source of dry fruits grown in high-altitude orchards.',
            'The region is associated with apricots, walnuts, almonds, mulberries and pine nuts, cultivated across valleys such as Skardu, Hunza and Gilgit.',
            'North Dry Fruits sources products from this region and delivers them fresh across Pakistan.',
        ],
        originMatch: ['gilgit-baltistan', 'gilgit baltistan', 'baltistan', 'gilgit', 'skardu', 'hunza'],
        faqs: [
            {
                q: 'What dry fruits come from Gilgit-Baltistan?',
                a: 'Gilgit-Baltistan is associated with apricots (khubani), walnuts, almonds, dried mulberries and pine nuts (chilgoza).',
            },
            {
                q: 'Why are Gilgit-Baltistan dry fruits considered special?',
                a: 'They are grown in high-altitude mountain orchards with cold nights and strong sunlight, conditions often associated with concentrated flavour.',
            },
            {
                q: 'Can I buy Gilgit-Baltistan dry fruits online?',
                a: 'Yes. North Dry Fruits offers products sourced from the region with nationwide delivery across Pakistan.',
            },
        ],
    },
    'dry-fruits-skardu': {
        region: 'Skardu',
        title: 'Dry Fruits from Skardu — Apricots, Almonds & Walnuts',
        description:
            'Dry fruits from Skardu in Gilgit-Baltistan: apricots (khubani), almonds and walnuts from high-altitude orchards. Buy online, delivered across Pakistan.',
        h1: 'Dry Fruits from Skardu',
        intro: [
            'Skardu is a high-altitude region in Gilgit-Baltistan, northern Pakistan, known for its orchards and dried fruit.',
            'The area is commonly associated with apricots (khubani), almonds and walnuts.',
            'North Dry Fruits sources products from northern regions including Skardu and delivers fresh across Pakistan.',
        ],
        originMatch: ['skardu', 'baltistan'],
        faqs: [
            {
                q: 'What dry fruits come from Skardu?',
                a: 'Skardu is commonly associated with apricots (khubani), almonds and walnuts grown in high-altitude orchards.',
            },
            {
                q: 'Where can I buy Skardu dry fruits online?',
                a: 'North Dry Fruits offers products sourced from northern regions including Skardu, with nationwide delivery across Pakistan.',
            },
        ],
    },
    'dry-fruits-hunza': {
        region: 'Hunza',
        title: 'Dry Fruits from Hunza — Apricots, Mulberries & Almonds',
        description:
            'Dry fruits from Hunza Valley in Gilgit-Baltistan: apricots, dried mulberries and almonds. Buy online with fresh delivery across Pakistan.',
        h1: 'Dry Fruits from Hunza',
        intro: [
            'Hunza Valley, in Gilgit-Baltistan, is widely associated with apricots and dried mulberries.',
            'The valley\u2019s orchards also produce almonds and other nuts grown at high altitude.',
            'North Dry Fruits sources products from northern regions including Hunza and delivers fresh across Pakistan.',
        ],
        originMatch: ['hunza'],
        faqs: [
            {
                q: 'What dry fruits come from Hunza?',
                a: 'Hunza Valley is widely associated with apricots and dried mulberries, along with almonds and other nuts.',
            },
            {
                q: 'Where can I buy Hunza dry fruits online?',
                a: 'North Dry Fruits offers products sourced from northern regions including Hunza, with nationwide delivery across Pakistan.',
            },
        ],
    },
    'dry-fruits-gilgit': {
        region: 'Gilgit',
        title: 'Dry Fruits from Gilgit — Walnuts, Mulberries & More',
        description:
            'Dry fruits from Gilgit in Gilgit-Baltistan: walnuts, dried mulberries and other northern-grown products. Buy online, delivered across Pakistan.',
        h1: 'Dry Fruits from Gilgit',
        intro: [
            'Gilgit is a region in Gilgit-Baltistan, northern Pakistan, with a long tradition of growing dry fruits and nuts.',
            'The area is associated with walnuts, dried mulberries and other mountain-grown products.',
            'North Dry Fruits sources products from northern regions including Gilgit and delivers fresh across Pakistan.',
        ],
        originMatch: ['gilgit'],
        faqs: [
            {
                q: 'What dry fruits come from Gilgit?',
                a: 'Gilgit is associated with walnuts, dried mulberries and other mountain-grown dry fruits and nuts.',
            },
            {
                q: 'Where can I buy Gilgit dry fruits online?',
                a: 'North Dry Fruits offers products sourced from northern regions including Gilgit, with nationwide delivery across Pakistan.',
            },
        ],
    },
};

/**
 * Returns location SEO metadata for a slug, or null if the slug is unknown.
 * @param {string} slug URL path without the leading slash (e.g. "dry-fruits-skardu").
 */
function getLocationSeo(slug) {
    const key = (slug || '').toLowerCase();
    return LOCATION_SEO[key] || null;
}

module.exports = { getLocationSeo, LOCATION_SEO };
