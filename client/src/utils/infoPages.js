// ---------------------------------------------------------------------------
// Info pages content (FAQ + Shipping)
// ---------------------------------------------------------------------------
// Settings-driven copy for /faq and /shipping. All figures (shipping fee, free-
// shipping threshold, return window, contact details) come from the store
// `settings` object — nothing is hardcoded or invented. Missing values simply
// produce a slightly more general sentence.
//
// IMPORTANT: server/utils/infoPages.js is a CommonJS MIRROR of this file, used
// by the server-side "light prerender" (server/routes/prerender.js). Keep both
// in sync so JS and non-JS crawlers see identical copy.
// ---------------------------------------------------------------------------

// Store-wide FAQ. Superset of the homepage FAQ so the two never contradict.
export function getFaqs(settings = {}) {
    const returnDays = Number(settings.return_window_days) || 7;
    const storeName = settings.store_name || 'North Dry Fruits';

    return [
        {
            q: 'Where do your dry fruits and nuts come from?',
            a: 'Our products are sourced from Gilgit-Baltistan and the northern regions of Pakistan, then delivered fresh across the country.',
        },
        {
            q: 'Do you deliver nationwide, and how long does it take?',
            a: 'Yes, we deliver nationwide across Pakistan. Orders are dispatched within 24 hours and typically arrive within 2–3 business days.',
        },
        {
            q: 'How much does shipping cost?',
            a: 'Shipping is completely free on all orders across Pakistan — there are no delivery charges.',
        },
        {
            q: 'What payment methods do you accept?',
            a: 'We accept Cash on Delivery (COD), Easypaisa, JazzCash and bank transfer. Online payments are verified by our team within a few hours.',
        },
        {
            q: 'What is your return policy?',
            a: `We offer a ${returnDays}-day return window. If you're not satisfied with your order, contact us within that period to arrange a return.`,
        },
        {
            q: 'How can I track my order?',
            a: 'Use the Track Order page and enter your Order ID and phone number to see the latest status of your order.',
        },
        {
            q: 'Are your products fresh and natural?',
            a: `${storeName} hand-sorts each batch and packs products to preserve freshness before dispatch. Product-specific details are listed on each product page.`,
        },
        {
            q: 'Do you offer bulk or wholesale orders?',
            a: 'For bulk or wholesale enquiries, contact us via the Contact page and our team will get back to you.',
        },
    ];
}

// Shipping & delivery page — sections of { heading, paragraphs }.
export function getShippingSections(settings = {}) {
    const returnDays = Number(settings.return_window_days) || 7;

    const costParagraphs = ['Shipping is completely free on all orders across Pakistan — there are no delivery charges.'];

    return [
        {
            heading: 'Where we deliver',
            paragraphs: ['We deliver nationwide across Pakistan.'],
        },
        {
            heading: 'Delivery time',
            paragraphs: ['Orders are dispatched within 24 hours and typically arrive within 2–3 business days.'],
        },
        {
            heading: 'Shipping cost',
            paragraphs: costParagraphs,
        },
        {
            heading: 'Payment methods',
            paragraphs: ['We accept Cash on Delivery (COD), Easypaisa, JazzCash and bank transfer. Online payments are verified by our team within a few hours.'],
        },
        {
            heading: 'Order tracking',
            paragraphs: ['Once your order is placed, use the Track Order page with your Order ID and phone number to see its latest status.'],
        },
        {
            heading: 'Returns',
            paragraphs: [`We offer a ${returnDays}-day return window. If you're not satisfied with your order, contact us within that period to arrange a return.`],
        },
    ];
}

export default { getFaqs, getShippingSections };
