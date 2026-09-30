const fs = require('fs');
const path = require('path');
const { parseJSON } = require('../helpers');
const { getCategorySeo } = require('../utils/categorySeo');
const { getLocationSeo } = require('../utils/locationSeo');
const { getFaqs, getShippingSections } = require('../utils/infoPages');

/**
 * SEO: SERVER-SIDE META INJECTION ("light prerender")
 * ==================================================================
 * The storefront is a client-side SPA: index.html ships a single generic
 * <title>/description/OG set, and react-helmet-async only rewrites them
 * AFTER the JS bundle boots. Crawlers that don't execute JS (Bing, most
 * social/link scrapers, LLM crawlers) — and JS crawlers on a tight render
 * budget — therefore see the homepage metadata on EVERY url.
 *
 * This middleware fixes that WITHOUT a headless browser or SSR framework:
 * for the small set of content routes it looks the record up in the DB and
 * rewrites the <head> of the SPA shell with the correct per-page title,
 * description, canonical, Open Graph / Twitter tags and JSON-LD. React then
 * hydrates and produces the exact same tags, so there's no conflict.
 *
 * Design rules:
 *   - Only GET requests that accept text/html are handled (skips assets/XHR).
 *   - Only known content routes are enriched; everything else falls straight
 *     through to the untouched SPA shell.
 *   - Fail-open: any DB/read error -> serve the original index.html so a data
 *     blip never takes the site down.
 *   - The status code set by the soft-404 guard (seoStatus.js) is preserved.
 */
module.exports = function (pool, clientDistPath) {
    const indexPath = path.join(clientDistPath, 'index.html');

    // Cache the shell once; it's tiny and only changes on deploy (server restart).
    let shellCache = null;
    const readShell = () => {
        if (shellCache == null) {
            try {
                shellCache = fs.readFileSync(indexPath, 'utf8');
            } catch {
                shellCache = null;
            }
        }
        return shellCache;
    };

    // ---- small helpers -------------------------------------------------

    const escapeHtml = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // JSON-LD is embedded inside a <script>; only "<" needs neutralising so a
    // string value can't prematurely close the tag. JSON.stringify handles the rest.
    const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

    const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '');

    // Normalise any image reference to an absolute URL. Social/link crawlers
    // (Facebook, WhatsApp, X, LinkedIn) require an ABSOLUTE og:image URL — a
    // relative path is ignored and the preview shows no image.
    const absoluteImage = (img, siteUrl) => {
        if (!img || typeof img !== 'string') return null;
        if (/^https?:\/\//i.test(img)) return img;
        return `${siteUrl}${img.startsWith('/') ? '' : '/'}${img}`;
    };

    // Social link scrapers (WhatsApp, Facebook, X, LinkedIn) enforce a small
    // max size for preview images — WhatsApp in particular silently DROPS the
    // preview image (and often the whole card) when the og:image is more than a
    // few hundred KB. Our Cloudinary originals are often 1–3 MB PNGs, which is
    // why shared blog/product links showed no image or description.
    //
    // For Cloudinary-hosted images we inject an on-the-fly transformation right
    // after "/upload/" so the shared image is resized to the ideal 1200x630
    // social card, converted to JPEG and quality-optimised (typically <150 KB).
    // The stored original is untouched; non-Cloudinary URLs pass through as-is.
    const OG_TRANSFORM = 'w_1200,h_630,c_fill,g_auto,f_jpg,q_auto:good';
    const socialImage = (img) => {
        if (!img || typeof img !== 'string') return img;
        if (!/res\.cloudinary\.com\/.+\/upload\//.test(img)) return img;
        // Don't double-transform if params were somehow already present.
        if (new RegExp(`/upload/${OG_TRANSFORM.split(',')[0]}`).test(img)) return img;
        return img.replace(/\/upload\/(?!v\d+\/[^/]*[a-z]_[^/]+)/, `/upload/${OG_TRANSFORM}/`);
    };

    const clip = (s, n = 160) => {
        const t = stripHtml(s).replace(/\s+/g, ' ').trim();
        return t.length > n ? t.slice(0, n - 1).trimEnd() + '\u2026' : t;
    };

    let settingsCache = null;
    let settingsCacheAt = 0;
    const SETTINGS_TTL = 60 * 1000; // 1 min — settings change rarely.
    const getSettings = async () => {
        const now = Date.now();
        if (settingsCache && now - settingsCacheAt < SETTINGS_TTL) return settingsCache;
        const out = {};
        try {
            const [rows] = await pool.query(
                "SELECT `key`, value FROM settings WHERE `key` IN ('site_url','store_name','store_tagline','currency_code','currency_symbol','locale','hero_image_url','logo_url','free_shipping_threshold','default_shipping_fee','return_window_days','country_code','sku_prefix','contact_address','contact_phone','contact_email','social_facebook','social_instagram','social_twitter','social_youtube','social_linkedin')"
            );
            for (const r of rows) out[r.key] = r.value;
        } catch {
            // ignore — caller falls back to request-derived origin
        }
        settingsCache = out;
        settingsCacheAt = now;
        return out;
    };

    // ------------------------------------------------------------------
    // CRAWLABLE BODY (GEO / LLM SEO)
    // ==================================================================
    // The head injection above gives crawlers correct title/canonical/OG/
    // JSON-LD, but the <body> is just an empty <div id="root"></div> until
    // the JS bundle boots. Crawlers that don't execute JS (Bing, most LLM
    // crawlers like GPTBot / ClaudeBot / PerplexityBot) therefore have no
    // TEXT to read, summarise or cite.
    //
    // We inject a SEPARATE, static <div id="seo-prerender"> right AFTER the
    // React root (never inside it — so it can't interfere with hydration).
    // It carries the SAME facts the hydrated page shows: H1, a short direct
    // answer, key facts, an FAQ and internal links. The client removes this
    // node the instant React mounts (see client/src/main.jsx) so real users
    // never see duplicated content. Nothing here is hidden from users via
    // CSS and nothing contradicts the visible page — it mirrors it.
    //
    // Helpers below build small, well-formed HTML fragments. Everything that
    // originates from the DB is HTML-escaped. Only fields that actually exist
    // are rendered (no invented facts).
    // ------------------------------------------------------------------
    const liLink = (href, text) => `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`;

    const faqBlockHtml = (faqs) => {
        if (!Array.isArray(faqs) || !faqs.length) return '';
        const items = faqs
            .map((f) => `<div class="seo-faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`)
            .join('');
        return `<section><h2>Frequently asked questions</h2>${items}</section>`;
    };

    const factsListHtml = (facts) => {
        const rows = (facts || [])
            .filter((f) => f && f.value != null && String(f.value).trim() !== '')
            .map((f) => `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.value)}</li>`)
            .join('');
        return rows ? `<section><h2>Key facts</h2><ul>${rows}</ul></section>` : '';
    };

    const linksListHtml = (heading, links) => {
        const items = (links || [])
            .filter((l) => l && l.href && l.text)
            .map((l) => liLink(l.href, l.text))
            .join('');
        return items ? `<section><h2>${escapeHtml(heading)}</h2><ul>${items}</ul></section>` : '';
    };

    // Assemble a crawlable body for a simple/static page from an H1, one or more
    // answer paragraphs, an optional FAQ and a set of nav links. Mirrors the copy
    // the SPA shows so non-JS crawlers read the same facts.
    const staticBodyHtml = ({ h1, paragraphs = [], faqs = [], links = [] }) => {
        const paras = paragraphs
            .filter((p) => p && String(p).trim())
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join('');
        return (
            `<article>` +
            `<h1>${escapeHtml(h1)}</h1>` +
            paras +
            faqBlockHtml(faqs) +
            linksListHtml('Explore', links) +
            `</article>`
        );
    };

    // Build the replacement <head> tags and swap them into the shell.
    const render = (shell, meta) => {
        const {
            title, description, canonical, ogImage, ogType = 'website', jsonLd, bodyHtml,
        } = meta;

        const descEsc = escapeHtml(description);
        const titleEsc = escapeHtml(title);
        const canonEsc = escapeHtml(canonical);
        const imgEsc = escapeHtml(ogImage);

        let html = shell;

        // <title>
        html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleEsc}</title>`);

        // meta description
        html = html.replace(
            /<meta\s+name="description"[^>]*>/i,
            `<meta name="description" content="${descEsc}" />`
        );

        // Open Graph / Twitter — replace the individual static baseline tags.
        html = html
            .replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${titleEsc}" />`)
            .replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${descEsc}" />`)
            .replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${escapeHtml(ogType)}" />`)
            .replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonEsc}" />`)
            .replace(/<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${imgEsc}" />`)
            .replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${titleEsc}" />`)
            .replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${descEsc}" />`)
            .replace(/<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${imgEsc}" />`);

        // Inject a canonical + (optional) page JSON-LD right before </head>.
        // These IDs let us confirm injection happened and keep them grouped.
        let injected = '';
        if (canonical) {
            injected += `\n  <link rel="canonical" href="${canonEsc}" data-prerender="1" />`;
        }
        if (jsonLd) {
            injected += `\n  <script type="application/ld+json" data-prerender="1">${jsonLdSafe(jsonLd)}</script>`;
        }
        if (injected) {
            html = html.replace(/<\/head>/i, `${injected}\n</head>`);
        }

        // Inject the crawlable static body AFTER <div id="root"></div> so it
        // never interferes with React hydration. The client removes it on mount.
        if (bodyHtml) {
            const block = `\n  <div id="seo-prerender" data-prerender="1">${bodyHtml}</div>`;
            if (/<div id="root"><\/div>/i.test(html)) {
                html = html.replace(/<div id="root"><\/div>/i, `<div id="root"></div>${block}`);
            } else {
                // Fallback: place it just before the module script / </body>.
                html = html.replace(/<\/body>/i, `${block}\n</body>`);
            }
        }

        return html;
    };

    // ---- route resolvers ----------------------------------------------

    // A lightweight, consistent Organization/OnlineStore node emitted on every
    // content page so that publisher/seller `@id` references resolve to a
    // single canonical entity across the whole site (mirrors client Home.jsx).
    const organizationStub = (s, siteUrl) => {
        const storeName = s.store_name || 'North Dry Fruits';
        const sameAs = [
            s.social_facebook, s.social_instagram, s.social_twitter,
            s.social_youtube, s.social_linkedin,
        ].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
        return {
            '@type': 'OnlineStore',
            '@id': `${siteUrl}/#organization`,
            name: storeName,
            url: `${siteUrl}/`,
            logo: `${siteUrl}/icons.svg`,
            ...(sameAs.length ? { sameAs } : {}),
        };
    };

    const buildProduct = (p, s, siteUrl) => {
        const url = `${siteUrl}/product/${p.slug}`;
        const storeName = s.store_name || 'North Dry Fruits';
        const tagline = s.store_tagline || 'quality products at great prices.';
        const desc = clip(p.description || `Buy ${p.name} - ${tagline}`);
        const image = absoluteImage(p.image_url, siteUrl) || `${siteUrl}/placeholder.png`;
        const currencyCode = s.currency_code || 'PKR';
        const availability = p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

        // Prefer real sellable prices from weight options; fall back to base_price.
        // (Mirrors the client's ProductDetail.jsx offer logic.)
        const weightOptions = parseJSON(p.weight_options) || [];
        const optionPrices = (Array.isArray(weightOptions) ? weightOptions : [])
            .map(o => Number(o.price))
            .filter(n => Number.isFinite(n) && n > 0);
        const lowPrice = optionPrices.length ? Math.min(...optionPrices) : Number(p.base_price) || 0;
        const highPrice = optionPrices.length ? Math.max(...optionPrices) : Number(p.base_price) || 0;

        const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

        // Shipping is always free on every order — no delivery charges.
        const shippingRate = 0;
        const countryCode = s.country_code || 'PK';
        const shippingDetails = {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: shippingRate, currency: currencyCode },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: countryCode },
            deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
                transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 3, unitCode: 'DAY' },
            },
        };
        const returnPolicy = {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: countryCode,
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: Number(s.return_window_days) || 7,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
        };
        const commonOfferFields = {
            priceCurrency: currencyCode,
            availability,
            url,
            priceValidUntil,
            shippingDetails,
            hasMerchantReturnPolicy: returnPolicy,
        };
        const offers = (optionPrices.length > 1 && lowPrice !== highPrice)
            ? { '@type': 'AggregateOffer', offerCount: optionPrices.length, lowPrice, highPrice, ...commonOfferFields }
            : { '@type': 'Offer', price: lowPrice, ...commonOfferFields };

        // additionalProperty: expose per-product facts as machine-readable
        // key/values (mirrors client ProductDetail.jsx).
        const weightLabels = (Array.isArray(weightOptions) ? weightOptions : [])
            .map(o => o.label).filter(Boolean);
        const additionalProperty = [
            p.origin && { '@type': 'PropertyValue', name: 'Origin', value: p.origin },
            p.shelf_life && { '@type': 'PropertyValue', name: 'Shelf Life', value: p.shelf_life },
            p.storage_instructions && { '@type': 'PropertyValue', name: 'Storage', value: p.storage_instructions },
            weightLabels.length && { '@type': 'PropertyValue', name: 'Available Weights', value: weightLabels.join(', ') },
        ].filter(Boolean);

        // Per-product FAQ (mirrors client) — PRODUCT-SPECIFIC only, so it does
        // not duplicate the store-wide shipping/returns FAQ on the homepage.
        const faqs = [
            p.origin && { q: `Where does ${p.name} come from?`, a: `${p.name} is sourced from ${p.origin}.` },
            p.shelf_life && { q: `What is the shelf life of ${p.name}?`, a: `${p.name} has a shelf life of ${p.shelf_life}.` },
            p.storage_instructions && { q: `How should I store ${p.name}?`, a: `${p.storage_instructions}` },
            weightLabels.length && { q: `What sizes is ${p.name} available in?`, a: `${p.name} is available in ${weightLabels.join(', ')}.` },
        ].filter(Boolean);
        const faqSchema = faqs.length ? {
            '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
        } : null;

        // brand + sku (mirrors client). sku derived from prefix + id.
        const productSku = (p.id != null) ? `${s.sku_prefix || 'GBM'}${p.id}` : null;

        const graph = [
            organizationStub(s, siteUrl),
            {
                '@type': 'Product',
                name: p.name,
                description: p.description ? clip(p.description, 500) : `Buy ${p.name} - ${tagline}`,
                image,
                brand: { '@type': 'Brand', name: storeName },
                ...(productSku ? { sku: productSku } : {}),
                ...(p.category_name ? { category: p.category_name } : {}),
                ...(additionalProperty.length ? { additionalProperty } : {}),
                offers: { ...offers, seller: { '@id': `${siteUrl}/#organization` } },
                ...(p.review_count > 0 ? {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: p.rating,
                        reviewCount: p.review_count,
                    },
                } : {}),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                    { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
                    { '@type': 'ListItem', position: 3, name: p.category_name, item: `${siteUrl}/products/${p.category_slug}` },
                    { '@type': 'ListItem', position: 4, name: p.name, item: url },
                ],
            },
            ...(faqSchema ? [faqSchema] : []),
        ];
        // ---- crawlable static body (mirrors the visible product page) ----
        const priceLabel = optionPrices.length
            ? (lowPrice === highPrice
                ? `${s.currency_symbol || 'Rs '}${lowPrice.toLocaleString()}`
                : `${s.currency_symbol || 'Rs '}${lowPrice.toLocaleString()} – ${s.currency_symbol || 'Rs '}${highPrice.toLocaleString()}`)
            : null;
        const shortAnswer = p.origin
            ? `${p.name} is a premium ${p.category_name ? p.category_name.toLowerCase() : 'natural product'} sourced from ${p.origin}, sold online by ${storeName} with delivery across Pakistan.`
            : `${p.name} is available to buy online from ${storeName} with delivery across Pakistan.`;
        const productFacts = [
            { label: 'Product', value: p.name },
            p.category_name && { label: 'Category', value: p.category_name },
            p.origin && { label: 'Origin', value: p.origin },
            weightLabels.length && { label: 'Available weights', value: weightLabels.join(', ') },
            priceLabel && { label: 'Price', value: priceLabel },
            p.shelf_life && { label: 'Shelf life', value: p.shelf_life },
            p.storage_instructions && { label: 'Storage', value: p.storage_instructions },
            { label: 'Availability', value: p.stock > 0 ? 'In stock' : 'Out of stock' },
            { label: 'Delivery', value: 'Nationwide across Pakistan, typically 2–3 business days' },
        ].filter(Boolean);
        // Region landing pages this product's origin matches (same originMatch
        // terms the region pages use). Links product -> region for the knowledge
        // graph. Only emitted when the product actually has an origin set.
        let regionLinks = [];
        if (p.origin) {
            const o = String(p.origin).toLowerCase();
            const all = require('../utils/locationSeo').LOCATION_SEO;
            regionLinks = Object.entries(all)
                .filter(([, loc]) => (loc.originMatch || []).some((t) => o.includes(String(t).toLowerCase())))
                .map(([slug, loc]) => ({ href: `${siteUrl}/${slug}`, text: `Dry fruits from ${loc.region}` }));
            if (regionLinks.length > 1) {
                regionLinks = regionLinks.filter((l) => !l.href.endsWith('/dry-fruits-pakistan'));
            }
        }
        const productLinks = [
            p.category_name && p.category_slug && { href: `${siteUrl}/products/${p.category_slug}`, text: `Browse more ${p.category_name}` },
            ...regionLinks,
            { href: `${siteUrl}/products`, text: 'View all products' },
            { href: `${siteUrl}/about`, text: `About ${storeName}` },
            { href: `${siteUrl}/contact`, text: 'Contact & bulk orders' },
        ].filter(Boolean);
        const descText = p.description ? clip(p.description, 600) : '';
        const bodyHtml =
            `<article>` +
            `<h1>${escapeHtml(p.name)}</h1>` +
            `<p>${escapeHtml(shortAnswer)}</p>` +
            (descText ? `<section><h2>Description</h2><p>${escapeHtml(descText)}</p></section>` : '') +
            factsListHtml(productFacts) +
            faqBlockHtml(faqs) +
            linksListHtml('Related links', productLinks) +
            `</article>`;

        return {
            title: `${p.name} | ${storeName}`,
            description: desc,
            canonical: url,
            ogImage: socialImage(image),
            ogType: 'product',
            jsonLd: { '@context': 'https://schema.org', '@graph': graph },
            bodyHtml,
        };
    };

    // fallbackImage: used for the share preview when the blog has no image of
    // its own (e.g. a related product image), so a shared link still shows a
    // relevant picture instead of the generic placeholder.
    const buildBlog = (b, s, siteUrl, fallbackImage) => {
        const url = `${siteUrl}/blog/${b.slug}`;
        const storeName = s.store_name || 'North Dry Fruits';
        const image = absoluteImage(b.image_url, siteUrl)
            || absoluteImage(fallbackImage, siteUrl)
            || undefined;
        const published = b.is_published ? (b.updated_at || b.created_at) : b.created_at;
        const desc = clip(b.meta_description || b.excerpt || b.title);
        const breadcrumb = {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
                ...(b.category_name && b.category_slug
                    ? [{ '@type': 'ListItem', position: 3, name: b.category_name, item: `${siteUrl}/blog/${b.category_slug}` }]
                    : []),
                { '@type': 'ListItem', position: b.category_name && b.category_slug ? 4 : 3, name: b.title, item: url },
            ],
        };
        // Lightweight Organization node so publisher/seller @id references on
        // this page resolve to the same entity as the homepage Organization.
        const orgStub = organizationStub(s, siteUrl);
        const posting = {
            '@type': 'BlogPosting',
            headline: b.title,
            description: b.meta_description || b.excerpt || b.title,
            ...(image ? { image } : {}),
            datePublished: published,
            dateModified: b.updated_at || published,
            author: { '@type': 'Person', name: b.author || storeName },
            publisher: { '@id': `${siteUrl}/#organization` },
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        };
        // ---- crawlable static body ----
        // Use the excerpt / meta description (plain text) as the citable summary
        // rather than dumping the full article HTML into the escaped block.
        const summary = stripHtml(b.excerpt || b.meta_description || '').replace(/\s+/g, ' ').trim();
        const blogLinks = [
            b.category_name && b.category_slug && { href: `${siteUrl}/blog/${b.category_slug}`, text: `More in ${b.category_name}` },
            { href: `${siteUrl}/blog`, text: 'All articles' },
            { href: `${siteUrl}/products`, text: 'Shop products' },
        ].filter(Boolean);
        const blogBody =
            `<article>` +
            `<h1>${escapeHtml(b.title)}</h1>` +
            (summary ? `<p>${escapeHtml(clip(summary, 600))}</p>` : '') +
            linksListHtml('Related links', blogLinks) +
            `</article>`;

        return {
            title: b.meta_title || `${b.title} | ${storeName}`,
            description: desc,
            canonical: url,
            ogImage: socialImage(image) || `${siteUrl}/placeholder.png`,
            ogType: 'article',
            jsonLd: { '@context': 'https://schema.org', '@graph': [orgStub, posting, breadcrumb] },
            bodyHtml: blogBody,
        };
    };

    // `products` (optional) is a list of { name, slug } for this category, used
    // to render crawlable links + an ItemList so search/AI crawlers see which
    // products the category contains without executing JS.
    const buildCategoryListing = (cat, s, siteUrl, products = []) => {
        const name = cat.name;
        const url = `${siteUrl}/products/${cat.slug}`;
        // Use the SAME hand-written copy the client uses (getCategorySeo) so the
        // prerendered title/description match react-helmet-async after hydration.
        const seo = getCategorySeo(cat.slug, name);

        const productList = (Array.isArray(products) ? products : []).filter((p) => p && p.slug && p.name);
        const graph = [
            organizationStub(s, siteUrl),
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                    { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
                    { '@type': 'ListItem', position: 3, name, item: url },
                ],
            },
        ];
        // ItemList of the products in this category (GEO: exposes the catalog).
        if (productList.length) {
            graph.push({
                '@type': 'ItemList',
                name,
                numberOfItems: productList.length,
                itemListElement: productList.map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `${siteUrl}/product/${p.slug}`,
                    name: p.name,
                })),
            });
        }

        // ---- crawlable static body ----
        const productLinks = productList.map((p) => ({ href: `${siteUrl}/product/${p.slug}`, text: p.name }));
        const bodyHtml =
            `<article>` +
            `<h1>${escapeHtml(name)}</h1>` +
            `<p>${escapeHtml(clip(seo.description, 300))}</p>` +
            linksListHtml(`Products in ${name}`, productLinks) +
            linksListHtml('Explore', [
                { href: `${siteUrl}/products`, text: 'All products' },
                { href: `${siteUrl}/about`, text: `About ${s.store_name || 'North Dry Fruits'}` },
                { href: `${siteUrl}/contact`, text: 'Contact & bulk orders' },
            ]) +
            `</article>`;

        return {
            title: seo.title,
            description: clip(seo.description),
            canonical: url,
            ogImage: cat.image_url && /^https?:\/\//i.test(cat.image_url) ? socialImage(cat.image_url) : `${siteUrl}/placeholder.png`,
            ogType: 'website',
            jsonLd: { '@context': 'https://schema.org', '@graph': graph },
            bodyHtml,
        };
    };

    // Region landing page (/dry-fruits-*). `seo` is the LOCATION_SEO entry and
    // `products` are the products whose stored `origin` matches the region (may
    // be empty — the page then renders as an informational region page).
    const buildLocation = (slug, seo, s, siteUrl, products = []) => {
        const url = `${siteUrl}/${slug}`;
        const productList = (Array.isArray(products) ? products : []).filter((p) => p && p.slug && p.name);

        const graph = [
            organizationStub(s, siteUrl),
            {
                '@type': 'WebPage',
                '@id': url,
                name: seo.h1,
                description: seo.description,
                about: {
                    '@type': 'Place',
                    name: seo.region,
                    ...(seo.region !== 'Pakistan'
                        ? { containedInPlace: { '@type': 'Place', name: 'Gilgit-Baltistan, Pakistan' } }
                        : {}),
                },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                    { '@type': 'ListItem', position: 2, name: seo.h1, item: url },
                ],
            },
        ];
        if (seo.faqs && seo.faqs.length) {
            graph.push({
                '@type': 'FAQPage',
                mainEntity: seo.faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            });
        }
        if (productList.length) {
            graph.push({
                '@type': 'ItemList',
                numberOfItems: productList.length,
                itemListElement: productList.map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `${siteUrl}/product/${p.slug}`,
                    name: p.name,
                })),
            });
        }

        // ---- crawlable static body ----
        const intro = (seo.intro || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
        const productLinks = productList.map((p) => ({ href: `${siteUrl}/product/${p.slug}`, text: p.name }));
        const bodyHtml =
            `<article>` +
            `<h1>${escapeHtml(seo.h1)}</h1>` +
            intro +
            linksListHtml(`Products from ${seo.region}`, productLinks) +
            faqBlockHtml((seo.faqs || []).map((f) => ({ q: f.q, a: f.a }))) +
            linksListHtml('Explore', [
                { href: `${siteUrl}/products`, text: 'All products' },
                { href: `${siteUrl}/dry-fruits-gilgit-baltistan`, text: 'Dry fruits from Gilgit-Baltistan' },
                { href: `${siteUrl}/about`, text: `About ${s.store_name || 'North Dry Fruits'}` },
            ]) +
            `</article>`;

        return {
            title: seo.title,
            description: clip(seo.description),
            canonical: url,
            ogImage: s.hero_image_url || `${siteUrl}/placeholder.png`,
            ogType: 'website',
            jsonLd: { '@context': 'https://schema.org', '@graph': graph },
            bodyHtml,
        };
    };

    // Static/simple routes get a correct title + canonical even without a DB row.
    // Each entry also supplies `h1` + `paragraphs` (and optional `faqs`) so the
    // prerendered <body> carries the same facts the SPA shows to real users.
    const STATIC_ROUTES = {
        '/products': (s) => ({
            title: 'All Products',
            description: 'Browse the full catalog of premium dry fruits, nuts and natural products.',
            h1: 'All Products',
            paragraphs: [
                `Browse the full catalog of premium dry fruits, nuts and natural products from ${s.store_name || 'North Dry Fruits'}.`,
                'Products are sourced from Gilgit-Baltistan and northern Pakistan and delivered fresh nationwide, typically within 2–3 business days.',
            ],
        }),
        '/about': (s) => ({
            title: 'About Us',
            description: 'Our story, sourcing and quality commitment.',
            h1: `About ${s.store_name || 'North Dry Fruits'}`,
            paragraphs: [
                `${s.store_name || 'North Dry Fruits'} is an online store offering dry fruits, nuts and natural products sourced from Gilgit-Baltistan and the northern regions of Pakistan.`,
                'We work with growers in regions such as Skardu, Hunza and Gilgit, hand-sort each batch, and deliver fresh across Pakistan.',
            ],
        }),
        '/contact': (s) => ({
            title: 'Contact Us',
            description: 'Get in touch for bulk orders, order inquiries or customer support.',
            h1: `Contact ${s.store_name || 'North Dry Fruits'}`,
            paragraphs: [
                'Get in touch for bulk orders, order inquiries or customer support.',
                ...(s.contact_phone ? [`Phone: ${s.contact_phone}`] : []),
                ...(s.contact_email ? [`Email: ${s.contact_email}`] : []),
                ...(s.contact_address ? [`Address: ${s.contact_address}`] : []),
            ],
        }),
        '/privacy': () => ({
            title: 'Policies',
            description: 'Privacy policy, terms & conditions and refund policy.',
            h1: 'Policies',
            paragraphs: [
                'Read our privacy policy, terms & conditions and refund policy.',
            ],
        }),
        '/blog': () => ({
            title: 'Blog',
            description: 'Articles on nutrition, recipes and product guides.',
            h1: 'Blog',
            paragraphs: [
                'Articles on nutrition, recipes and product guides covering dry fruits, nuts and natural products from northern Pakistan.',
            ],
        }),
    };

    // ---- middleware ----------------------------------------------------

    return async function prerender(req, res, next) {
        // Only enrich top-level HTML page loads.
        if (req.method !== 'GET') return next();
        const accept = req.headers.accept || '';
        if (!accept.includes('text/html')) return next();

        const shell = readShell();
        if (!shell) return next(); // no build output -> let express handle it

        const urlPath = req.path.replace(/\/+$/, '') || '/';

        try {
            const s = await getSettings();
            const siteUrl = (s.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

            let meta = null;

            // /product/:slug
            let m = urlPath.match(/^\/product\/([^/]+)$/);
            if (m) {
                const [rows] = await pool.query(
                    'SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND (p.is_deleted IS NULL OR p.is_deleted = 0) LIMIT 1',
                    [decodeURIComponent(m[1])]
                );
                if (rows.length) meta = buildProduct(rows[0], s, siteUrl);
            }

            // /products/:category  (skip the bare /products handled below)
            if (!meta) {
                m = urlPath.match(/^\/products\/([^/]+)$/);
                if (m) {
                    const [rows] = await pool.query(
                        'SELECT id, name, slug, image_url, description FROM categories WHERE slug = ? LIMIT 1',
                        [decodeURIComponent(m[1])]
                    );
                    if (rows.length) {
                        // Fetch the products in this category so the prerendered
                        // body + ItemList expose the catalog to non-JS crawlers.
                        let categoryProducts = [];
                        try {
                            const [prods] = await pool.query(
                                'SELECT name, slug FROM products WHERE category_id = ? AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY is_featured DESC, id DESC LIMIT 50',
                                [rows[0].id]
                            );
                            categoryProducts = prods;
                        } catch {
                            // ignore — category page still renders without the list
                        }
                        meta = buildCategoryListing(rows[0], s, siteUrl, categoryProducts);
                    }
                }
            }

            // /dry-fruits-*  (region landing pages)
            if (!meta) {
                const locSlug = urlPath.replace(/^\/+/, '');
                const locSeo = getLocationSeo(locSlug);
                if (locSeo) {
                    // Products actually sourced from this region (origin LIKE).
                    let locProducts = [];
                    try {
                        const terms = Array.isArray(locSeo.originMatch) ? locSeo.originMatch : [];
                        if (terms.length) {
                            const clause = terms.map(() => 'LOWER(origin) LIKE ?').join(' OR ');
                            const params = terms.map((t) => `%${String(t).toLowerCase()}%`);
                            const [prods] = await pool.query(
                                `SELECT name, slug FROM products
                                 WHERE (is_deleted IS NULL OR is_deleted = 0)
                                   AND origin IS NOT NULL AND origin != ''
                                   AND (${clause})
                                 ORDER BY is_featured DESC, id DESC LIMIT 60`,
                                params
                            );
                            locProducts = prods;
                        }
                    } catch {
                        // ignore — page still renders without the product list
                    }
                    meta = buildLocation(locSlug, locSeo, s, siteUrl, locProducts);
                }
            }

            // /faq  — store-wide FAQ with FAQPage schema + crawlable body.
            if (!meta && urlPath === '/faq') {
                const faqs = getFaqs(s);
                const canonical = `${siteUrl}/faq`;
                meta = {
                    title: `Frequently Asked Questions | ${s.store_name || 'North Dry Fruits'}`,
                    description: clip('Answers to common questions about ordering, sourcing, shipping, payment, returns and tracking at North Dry Fruits.'),
                    canonical,
                    ogImage: s.hero_image_url || `${siteUrl}/placeholder.png`,
                    ogType: 'website',
                    jsonLd: {
                        '@context': 'https://schema.org',
                        '@graph': [
                            organizationStub(s, siteUrl),
                            {
                                '@type': 'FAQPage',
                                '@id': `${canonical}#faq`,
                                mainEntity: faqs.map((f) => ({
                                    '@type': 'Question',
                                    name: f.q,
                                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                                })),
                            },
                            {
                                '@type': 'BreadcrumbList',
                                itemListElement: [
                                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                                    { '@type': 'ListItem', position: 2, name: 'FAQ', item: canonical },
                                ],
                            },
                        ],
                    },
                    bodyHtml:
                        `<article><h1>Frequently Asked Questions</h1>` +
                        faqBlockHtml(faqs) +
                        linksListHtml('Explore', [
                            { href: `${siteUrl}/shipping`, text: 'Shipping & delivery' },
                            { href: `${siteUrl}/products`, text: 'All products' },
                            { href: `${siteUrl}/contact`, text: 'Contact & bulk orders' },
                        ]) +
                        `</article>`,
                };
            }

            // /shipping — delivery info as sections + FAQPage schema.
            if (!meta && urlPath === '/shipping') {
                const sections = getShippingSections(s);
                const canonical = `${siteUrl}/shipping`;
                const sectionParas = sections
                    .map((sec) => `<section><h2>${escapeHtml(sec.heading)}</h2>${(sec.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</section>`)
                    .join('');
                meta = {
                    title: `Shipping & Delivery Across Pakistan | ${s.store_name || 'North Dry Fruits'}`,
                    description: clip('How North Dry Fruits ships orders across Pakistan: areas served, delivery times, costs, payment methods, order tracking and returns.'),
                    canonical,
                    ogImage: s.hero_image_url || `${siteUrl}/placeholder.png`,
                    ogType: 'website',
                    jsonLd: {
                        '@context': 'https://schema.org',
                        '@graph': [
                            organizationStub(s, siteUrl),
                            {
                                '@type': 'WebPage',
                                '@id': canonical,
                                name: 'Shipping & Delivery',
                                description: 'How North Dry Fruits ships orders across Pakistan.',
                            },
                            {
                                '@type': 'BreadcrumbList',
                                itemListElement: [
                                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                                    { '@type': 'ListItem', position: 2, name: 'Shipping & Delivery', item: canonical },
                                ],
                            },
                            {
                                '@type': 'FAQPage',
                                mainEntity: sections.map((sec) => ({
                                    '@type': 'Question',
                                    name: sec.heading,
                                    acceptedAnswer: { '@type': 'Answer', text: (sec.paragraphs || []).join(' ') },
                                })),
                            },
                        ],
                    },
                    bodyHtml:
                        `<article><h1>Shipping & Delivery</h1>` +
                        sectionParas +
                        linksListHtml('Explore', [
                            { href: `${siteUrl}/faq`, text: 'FAQ' },
                            { href: `${siteUrl}/track-order`, text: 'Track your order' },
                            { href: `${siteUrl}/products`, text: 'All products' },
                        ]) +
                        `</article>`,
                };
            }

            // /guides — pillar hub linking to published articles + region pages.
            if (!meta && urlPath === '/guides') {
                const canonical = `${siteUrl}/guides`;
                let articles = [];
                try {
                    const [rows] = await pool.query(
                        'SELECT title, slug, excerpt, meta_description FROM blogs WHERE is_published = 1 ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 24'
                    );
                    articles = rows;
                } catch {
                    articles = [];
                }
                const articleLinks = articles
                    .filter((a) => a && a.slug && a.title)
                    .map((a) => ({ href: `${siteUrl}/blog/${a.slug}`, text: a.title }));
                const { LOCATION_SEO } = require('../utils/locationSeo');
                const regionLinks = Object.entries(LOCATION_SEO).map(([slug, loc]) => ({ href: `${siteUrl}/${slug}`, text: loc.h1 }));
                meta = {
                    title: `Guides — Dry Fruits, Nuts & Natural Products | ${s.store_name || 'North Dry Fruits'}`,
                    description: clip('Guides and articles on dry fruits, nuts and natural products from Gilgit-Baltistan and northern Pakistan — buying, storage, origins and more.'),
                    canonical,
                    ogImage: s.hero_image_url || `${siteUrl}/placeholder.png`,
                    ogType: 'website',
                    jsonLd: {
                        '@context': 'https://schema.org',
                        '@graph': [
                            organizationStub(s, siteUrl),
                            {
                                '@type': 'CollectionPage',
                                '@id': canonical,
                                name: 'Guides',
                                description: 'Guides and articles on dry fruits, nuts and natural products from northern Pakistan.',
                            },
                            {
                                '@type': 'BreadcrumbList',
                                itemListElement: [
                                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                                    { '@type': 'ListItem', position: 2, name: 'Guides', item: canonical },
                                ],
                            },
                        ],
                    },
                    bodyHtml:
                        `<article><h1>Guides & Articles</h1>` +
                        `<p>${escapeHtml('Learn about dry fruits, nuts and natural products from Gilgit-Baltistan and northern Pakistan.')}</p>` +
                        linksListHtml('Articles', articleLinks) +
                        linksListHtml('Explore by region', regionLinks) +
                        `</article>`,
                };
            }

            // /blog/:slug  (but NOT /blog/page/N and NOT a blog CATEGORY slug)
            if (!meta) {
                m = urlPath.match(/^\/blog\/([^/]+)$/);
                if (m && m[1] !== 'page') {
                    const slug = decodeURIComponent(m[1]);
                    // A blog category listing? Give it a listing-style head.
                    const [cat] = await pool.query('SELECT name, slug FROM blog_categories WHERE slug = ? LIMIT 1', [slug]);
                    if (cat.length) {
                        meta = {
                            title: `${cat[0].name} | ${s.store_name || 'North Dry Fruits'}`,
                            description: clip(`Read the latest ${cat[0].name} articles, guides and recipes.`),
                            canonical: `${siteUrl}/blog/${cat[0].slug}`,
                            ogImage: `${siteUrl}/placeholder.png`,
                            ogType: 'website',
                        };
                    } else {
                        const [rows] = await pool.query(
                            'SELECT b.*, bc.name AS category_name, bc.slug AS category_slug FROM blogs b LEFT JOIN blog_categories bc ON b.category_id = bc.id WHERE b.slug = ? AND b.is_published = 1 LIMIT 1',
                            [slug]
                        );
                        if (rows.length) {
                            const b = rows[0];
                            // If the blog has no image of its own, borrow a product
                            // image so the social share preview still shows a picture.
                            let fallbackImage = null;
                            if (!b.image_url) {
                                try {
                                    const [prod] = await pool.query(
                                        'SELECT image_url FROM products WHERE image_url IS NOT NULL AND image_url != \'\' AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY is_featured DESC, id DESC LIMIT 1'
                                    );
                                    if (prod.length) fallbackImage = prod[0].image_url;
                                } catch {
                                    // ignore — falls back to placeholder below
                                }
                            }
                            meta = buildBlog(b, s, siteUrl, fallbackImage);
                        }
                    }
                }
            }

            // Static routes
            if (!meta && STATIC_ROUTES[urlPath]) {
                const base = STATIC_ROUTES[urlPath](s);
                // Shared nav links, minus a link to the current page itself.
                const navLinks = [
                    { href: `${siteUrl}/products`, text: 'All products' },
                    { href: `${siteUrl}/about`, text: `About ${s.store_name || 'North Dry Fruits'}` },
                    { href: `${siteUrl}/blog`, text: 'Blog' },
                    { href: `${siteUrl}/contact`, text: 'Contact & bulk orders' },
                ].filter((l) => l.href !== `${siteUrl}${urlPath}`);
                meta = {
                    title: `${base.title} | ${s.store_name || 'North Dry Fruits'}`,
                    description: clip(base.description),
                    canonical: `${siteUrl}${urlPath}`,
                    ogImage: s.hero_image_url || `${siteUrl}/placeholder.png`,
                    ogType: 'website',
                    bodyHtml: staticBodyHtml({
                        h1: base.h1 || base.title,
                        paragraphs: base.paragraphs || [base.description],
                        faqs: base.faqs || [],
                        links: navLinks,
                    }),
                };
            }

            // Homepage: the static shell already ships full meta + a WebSite/
            // Organization @graph, but it can't know the store's social links or
            // carry the store FAQ. Inject an Organization node with sameAs (same
            // @id => merges with the static one) plus a FAQPage so non-JS crawlers
            // get the social signals and the citable Q&A. Mirrors client Home.jsx.
            if (!meta && urlPath === '/') {
                const nodes = [];

                const sameAs = [
                    s.social_facebook, s.social_instagram, s.social_twitter,
                    s.social_youtube, s.social_linkedin,
                ].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
                // Organization enrichment (same @id => merges with the static
                // node in index.html). Mirrors client Home.jsx organizationNode.
                const orgNode = {
                    '@context': 'https://schema.org',
                    '@type': 'OnlineStore',
                    '@id': `${siteUrl}/#organization`,
                    ...(sameAs.length ? { sameAs } : {}),
                    ...(s.contact_address ? {
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: s.contact_address,
                            addressCountry: s.country_code || 'PK',
                        },
                    } : {}),
                    ...((s.contact_phone || s.contact_email) ? {
                        contactPoint: {
                            '@type': 'ContactPoint',
                            ...(s.contact_phone ? { telephone: s.contact_phone } : {}),
                            ...(s.contact_email ? { email: s.contact_email } : {}),
                            contactType: 'customer service',
                            ...(s.country_code ? { areaServed: s.country_code } : {}),
                        },
                    } : {}),
                };
                // Only emit if it carries something beyond @type/@id.
                if (Object.keys(orgNode).length > 3) {
                    nodes.push(orgNode);
                }

                // Store-level FAQ (mirrors client Home.jsx homeFaqs).
                const returnDays = Number(s.return_window_days) || 7;
                const homeFaqs = [
                    { q: 'Where do your dry fruits and nuts come from?', a: 'Our products are sourced from Gilgit-Baltistan and the northern regions of Pakistan, then delivered fresh across the country.' },
                    { q: 'Do you deliver nationwide, and how long does it take?', a: 'Yes, we deliver nationwide across Pakistan. Orders are dispatched within 24 hours and typically arrive within 2\u20133 business days.' },
                    { q: 'How much does shipping cost?', a: 'Shipping is completely free on all orders across Pakistan — there are no delivery charges.' },
                    { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), Easypaisa, JazzCash and bank transfer. Online payments are verified by our team within a few hours.' },
                    { q: 'What is your return policy?', a: `We offer a ${returnDays}-day return window. If you're not satisfied with your order, contact us within that period to arrange a return.` },
                    { q: 'How can I track my order?', a: 'Use the Track Order page and enter your Order ID and phone number to see the latest status of your order.' },
                ];
                nodes.push({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    '@id': `${siteUrl}/#faq`,
                    mainEntity: homeFaqs.map((f) => ({
                        '@type': 'Question',
                        name: f.q,
                        acceptedAnswer: { '@type': 'Answer', text: f.a },
                    })),
                });

                const inject = nodes
                    .map((n) => `\n  <script type="application/ld+json" data-prerender="1">${jsonLdSafe(n)}</script>`)
                    .join('') + '\n</head>';
                const html = shell.replace(/<\/head>/i, inject);
                res.set('Content-Type', 'text/html; charset=utf-8');
                return res.send(html);
            }

            if (!meta) return next(); // unknown/dynamic route -> untouched shell

            res.set('Content-Type', 'text/html; charset=utf-8');
            // Preserve any status set upstream (e.g. 404 from the soft-404 guard).
            return res.send(render(shell, meta));
        } catch (err) {
            // Fail-open: never let SEO enrichment break page delivery.
            return next();
        }
    };
};
