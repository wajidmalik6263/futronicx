import React, { useState, useEffect, Suspense } from 'react';
import SEO from '../components/SEO';
import { getHomepageSections } from '../api/homepage';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { useSettings } from '../context/SettingsContext';

// Above-the-fold components stay eager: HeroBanner holds the LCP <h1>, and
// HomeSkeleton is the first-paint fallback. Bundling them with the Home chunk
// avoids an extra network round-trip before the hero can render.
import HeroBanner from '../components/homepage/HeroBanner';
import HomeSkeleton from '../components/homepage/HomeSkeleton';

// Below-the-fold section components are lazy-loaded so they don't inflate the
// Home chunk (which the browser must download + parse before the hero renders).
// Each becomes its own chunk fetched on demand as the user scrolls into view.
const ProductCarousel = React.lazy(() => import('../components/homepage/ProductCarousel'));
const ProductGrid = React.lazy(() => import('../components/homepage/ProductGrid'));
const CategoryShowcase = React.lazy(() => import('../components/homepage/CategoryShowcase'));
const PromoCards = React.lazy(() => import('../components/homepage/PromoCards'));
const ReviewsSection = React.lazy(() => import('../components/homepage/ReviewsSection'));
const BlogSection = React.lazy(() => import('../components/homepage/BlogSection'));

const SECTION_COMPONENTS = {
    hero_banner: HeroBanner,
    product_carousel: ProductCarousel,
    product_grid: ProductGrid,
    category_showcase: CategoryShowcase,
    promo_cards: PromoCards,
    reviews: ReviewsSection,
    blog_posts: BlogSection,
};

export default function Home() {
    const { settings } = useSettings();
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const data = await getHomepageSections();
                setSections(data);
            } catch (error) {
                console.error('Error fetching homepage sections:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSections();
    }, []);

    // Categories + a handful of products power ONLY the SEO structured data and
    // the meta-description word list — they never affect what is painted on
    // screen. Fetching them at mount competes with the hero/sections render for
    // the main thread and inflates Total Blocking Time. Defer both to browser
    // idle time so they run after the page is interactive. (requestIdleCallback
    // with a setTimeout fallback for browsers that lack it.)
    useEffect(() => {
        let cancelled = false;

        const loadSeoData = () => {
            getCategories()
                .then((data) => { if (!cancelled) setCategories(Array.isArray(data) ? data : []); })
                .catch((error) => console.error('Error fetching categories for SEO:', error));

            getProducts({ limit: 12 })
                .then((data) => { if (!cancelled) setProducts(Array.isArray(data) ? data : []); })
                .catch((error) => console.error('Error fetching products for SEO:', error));
        };

        const ric = typeof window !== 'undefined' && window.requestIdleCallback;
        const handle = ric
            ? window.requestIdleCallback(loadSeoData, { timeout: 2500 })
            : setTimeout(loadSeoData, 1200);

        return () => {
            cancelled = true;
            if (ric && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(handle);
            } else {
                clearTimeout(handle);
            }
        };
    }, []);

    // ------------------------------------------------------------------
    // Dynamic meta description
    // ------------------------------------------------------------------
    // Build a natural, comma-separated list of real product names and fold it
    // into the brand description. Falls back to categories, then to a sensible
    // default so the description is never empty before data loads.
    const buildProductList = () => {
        const names = products
            .map((p) => (p?.name || p?.title || '').trim())
            .filter(Boolean);

        // De-duplicate while preserving order.
        const unique = [...new Set(names)];
        const source = unique.length
            ? unique
            : categories.map((c) => (c?.name || c?.title || '').trim()).filter(Boolean);

        const list = source.slice(0, 6);
        if (list.length === 0) {
            return 'premium dry fruits, nuts and natural products';
        }
        if (list.length === 1) return list[0];
        return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
    };

    const metaDescription = `Shop 100% pure, natural dry fruits, herbal teas, and Skardu Shilajit directly from Gilgit-Baltistan. Order online for fast home delivery!`;

    // ------------------------------------------------------------------
    // SEO structured data
    // ------------------------------------------------------------------
    // A rich @graph (WebSite + SearchAction + Organization + SiteNavigation)
    // gives Google the signals it needs to potentially render "sitelinks"
    // (the labelled sub-links beneath the main search result). We can't force
    // sitelinks, but this is what makes them likely.
    // Fall back to the current origin so schema @id/url fields are never empty
    // or invalid on a deploy where site_url hasn't been configured yet.
    const baseUrl = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
    const storeName = settings.store_name || 'North Dry Fruits';

    // Main navigation entries mirrored from the site header.
    const navEntries = [
        { name: 'Products', path: '/products' },
        { name: 'Blog', path: '/blog' },
        { name: 'Track Order', path: '/track-order' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    // Top product categories become additional navigation targets — these are
    // the equivalent of "Walnuts", "Almonds" style sitelinks.
    const categoryEntries = categories
        .slice(0, 8)
        .map((c) => {
            const slug = c.slug || c.id;
            const name = c.name || c.title;
            if (!slug || !name) return null;
            return { name, path: `/products/${encodeURIComponent(slug)}` };
        })
        .filter(Boolean);

    const allNavEntries = [...navEntries, ...categoryEntries];

    // Social profile URLs -> Organization.sameAs (strengthens entity/knowledge
    // graph signals). Only include the ones actually configured in settings.
    const sameAs = [
        settings.social_facebook,
        settings.social_instagram,
        settings.social_twitter,
        settings.social_youtube,
        settings.social_linkedin,
    ].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));

    // ------------------------------------------------------------------
    // Store-level FAQ (shipping, returns, payment, sourcing, ordering).
    // Rendered visibly AND emitted as FAQPage structured data — the Q&A
    // format generative engines and Google AI Overviews cite most. Values are
    // pulled from settings so answers stay accurate.
    // ------------------------------------------------------------------
    const returnDays = Number(settings.return_window_days) || 7;

    const homeFaqs = [
        {
            q: 'Where do your dry fruits and nuts come from?',
            a: `Our products are sourced from Gilgit-Baltistan and the northern regions of Pakistan, then delivered fresh across the country.`,
        },
        {
            q: 'Do you deliver nationwide, and how long does it take?',
            a: `Yes, we deliver nationwide across Pakistan. Orders are dispatched within 24 hours and typically arrive within 2–3 business days.`,
        },
        {
            q: 'How much does shipping cost?',
            a: `Shipping is completely free on all orders across Pakistan — there are no delivery charges.`,
        },
        {
            q: 'What payment methods do you accept?',
            a: `We accept Cash on Delivery (COD), Easypaisa, JazzCash and bank transfer. Online payments are verified by our team within a few hours.`,
        },
        {
            q: 'What is your return policy?',
            a: `We offer a ${returnDays}-day return window. If you're not satisfied with your order, contact us within that period to arrange a return.`,
        },
        {
            q: 'How can I track my order?',
            a: `Use the Track Order page and enter your Order ID and phone number to see the latest status of your order.`,
        },
    ];

    const faqSchema = {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        "mainEntity": homeFaqs.map((f) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
    };

    // The Organization node is the canonical entity for the whole site. Every
    // other page references it by @id (`${baseUrl}/#organization`) as publisher
    // instead of redefining it, so search engines see ONE "North Dry Fruits"
    // entity rather than many. Typed as OnlineStore (a subtype of Organization)
    // since this is an e-commerce storefront.
    const organizationNode = {
        "@type": "OnlineStore",
        "@id": `${baseUrl}/#organization`,
        "name": storeName,
        "url": baseUrl || undefined,
        "logo": baseUrl ? `${baseUrl}/icons.svg` : undefined,
        ...(settings.store_tagline ? { "description": settings.store_tagline } : {}),
        ...(sameAs.length ? { "sameAs": sameAs } : {}),
        ...(settings.contact_address ? {
            "address": {
                "@type": "PostalAddress",
                "streetAddress": settings.contact_address,
                "addressCountry": settings.country_code || "PK",
            },
        } : {}),
        "contactPoint": {
            "@type": "ContactPoint",
            ...(settings.contact_phone ? { "telephone": settings.contact_phone } : {}),
            ...(settings.contact_email ? { "email": settings.contact_email } : {}),
            "contactType": "customer service",
            ...(settings.country_code ? { "areaServed": settings.country_code } : {}),
            "availableLanguage": settings.locale?.split('_')[0] || "en",
        },
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            organizationNode,
            {
                "@type": "WebSite",
                "@id": `${baseUrl}/#website`,
                "name": storeName,
                "url": baseUrl || undefined,
                "publisher": { "@id": `${baseUrl}/#organization` },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${baseUrl}/products?search={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            // One SiteNavigationElement node per link (the well-supported form)
            // rather than a single node with parallel name/url arrays.
            ...allNavEntries.map((e, i) => ({
                "@type": "SiteNavigationElement",
                "@id": `${baseUrl}/#nav-${i + 1}`,
                "name": e.name,
                "url": `${baseUrl}${e.path}`,
            })),
            faqSchema,
        ],
    };

    if (loading) {
        return (
            <>
                <SEO
                    rawTitle="Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits"
                    description={metaDescription}
                    canonical="/"
                    structuredData={structuredData}
                />
                <HomeSkeleton />
            </>
        );
    }

    return (
        <div className="space-y-10 sm:space-y-16 pb-6 sm:pb-16 min-h-[2600px] sm:min-h-[2200px]">
            <SEO
                rawTitle="Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits"
                description={metaDescription}
                canonical="/"
                structuredData={structuredData}
            />

            {sections
                .filter((section) => {
                    // Hide the "Most Sales Products" section from the homepage
                    const heading = (section.config?.heading || '').trim().toLowerCase();
                    return heading !== 'most sales products';
                })
                .map((section, index) => {
                const Component = SECTION_COMPONENTS[section.section_type];
                if (!Component) return null;
                // The first section (hero) must render eagerly since it holds the
                // LCP element. Everything below the fold is wrapped in content-
                // visibility:auto so its layout/paint (and any infinite animations)
                // stay off the initial-load critical path.
                if (index === 0) {
                    // Rendered eagerly (no cv-auto) since it holds the LCP element.
                    // Wrapped in Suspense anyway so it stays safe if a non-hero
                    // (lazy) section is ever ordered first; HeroBanner is eager so
                    // this resolves synchronously with no added cost.
                    return (
                        <Suspense key={section.id} fallback={<HomeSkeleton />}>
                            <Component config={section.config} />
                        </Suspense>
                    );
                }
                return (
                    <div key={section.id} className="cv-auto">
                        <Suspense fallback={<div className="min-h-[400px]" />}>
                            <Component config={section.config} />
                        </Suspense>
                    </div>
                );
            })}

            {sections.length === 0 && !loading && (
                <div className="max-w-[1400px] mx-auto px-4 py-20 text-center flex items-center justify-center min-h-[60vh]">
                    <p className="text-[#3A2E1F]/60 text-sm">Homepage content is being configured. Check back soon!</p>
                </div>
            )}

            {/* Blog section — always visible on landing page */}
            <div className="cv-auto">
                <Suspense fallback={<div className="min-h-[400px]" />}>
                    <BlogSection config={{ heading: 'Latest from Our Blog', maxItems: 4 }} />
                </Suspense>
            </div>

            {/* FAQ SECTION — visible Q&A backing the FAQPage structured data.
                Answers common shopper questions and gives AI/search engines
                extractable, citable content. */}
            <section className="cv-auto max-w-[1400px] mx-auto px-4 sm:px-6 w-full space-y-6 sm:space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A2E1F] font-body">Frequently Asked Questions</h2>
                    <p className="text-sm text-[#3A2E1F]/70 font-body">Everything you need to know about ordering, shipping and returns.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
                    {homeFaqs.map((f, i) => (
                        <details key={i} className="group border border-[#E8DEC8] rounded-2xl bg-[#FFFDF9] overflow-hidden transition-colors hover:border-[#D97706]/40">
                            <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-4 text-sm sm:text-base font-bold text-[#3A2E1F] font-body list-none">
                                <span>{f.q}</span>
                                <span className="text-[#D97706] text-2xl leading-none shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
                            </summary>
                            <div className="px-5 pb-5 text-sm text-[#3A2E1F]/75 leading-relaxed font-body">
                                {f.a}
                            </div>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}
