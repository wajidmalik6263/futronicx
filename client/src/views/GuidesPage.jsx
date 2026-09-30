import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Tag, HelpCircle, Truck, Snowflake, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { getBlogs } from '../api/blogs';
import { getCategories } from '../api/categories';
import { LOCATION_SEO } from '../utils/locationSeo';

// Guides hub — an informational index that links to published articles (real
// content from the blog system) plus region and category pages. It does not
// invent article text; it curates existing content into a pillar page that
// strengthens internal linking for GEO.
export default function GuidesPage() {
    const { settings } = useSettings();
    const storeName = (settings && settings.store_name) || 'North Dry Fruits';
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let active = true;
        getBlogs({ limit: 24 })
            .then((res) => {
                const data = res && res.data ? res.data : res;
                const list = Array.isArray(data) ? data : (data && data.blogs) || [];
                if (active) setArticles(list);
            })
            .catch(() => { if (active) setArticles([]); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        getCategories()
            .then((res) => {
                const data = res && res.data ? res.data : res;
                const list = Array.isArray(data) ? data : (data && data.categories) || [];
                if (active) setCategories(list);
            })
            .catch(() => { if (active) setCategories([]); });
        return () => { active = false; };
    }, []);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/guides`;
    const regions = Object.entries(LOCATION_SEO);

    // Aggregate the hand-written FAQs from the region metadata into a single,
    // de-duplicated "quick answers" list. This is real existing copy, not
    // invented content, and it doubles as FAQPage structured data.
    const faqs = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const [, loc] of regions) {
            for (const f of (loc.faqs || [])) {
                const key = (f.q || '').trim().toLowerCase();
                if (!key || seen.has(key)) continue;
                seen.add(key);
                out.push(f);
            }
        }
        return out.slice(0, 8);
    }, [regions]);

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': canonical,
                name: 'Guides',
                description: 'Guides and articles on dry fruits, nuts and natural products from northern Pakistan.',
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: 'Guides', item: canonical },
                ],
            },
            ...(faqs.length > 0
                ? [{
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((f) => ({
                        '@type': 'Question',
                        name: f.q,
                        acceptedAnswer: { '@type': 'Answer', text: f.a },
                    })),
                }]
                : []),
        ],
    };

    const tips = [
        {
            icon: ShieldCheck,
            title: 'How to buy quality dry fruits',
            text: 'Look for whole, uniform pieces with natural colour and no off smell. High-altitude, northern-grown nuts and dried fruits are prized for concentrated flavour.',
        },
        {
            icon: Snowflake,
            title: 'How to store them',
            text: 'Keep dry fruits and nuts in an airtight container away from heat and sunlight. For longer freshness, refrigerate — this helps preserve oils in nuts like walnuts.',
        },
        {
            icon: Truck,
            title: 'Delivery across Pakistan',
            text: 'Orders are delivered fresh nationwide, typically within 2–3 business days, with multiple payment options including Cash on Delivery.',
        },
    ];

    return (
        <div className="pb-16">
            <SEO
                rawTitle={`Guides — Dry Fruits, Nuts & Natural Products | ${storeName}`}
                description="Guides and articles on dry fruits, nuts and natural products from Gilgit-Baltistan and northern Pakistan — buying, storage, origins and more."
                canonical={canonical}
                structuredData={structuredData}
            />

            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Guides</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                    Guides & Articles
                </h1>
                <p className="text-sm text-[#3A2E1F]/80 mt-2 max-w-2xl">
                    Learn about dry fruits, nuts and natural products from Gilgit-Baltistan and northern Pakistan — buying, storage and origins.
                </p>
                <p className="text-sm text-[#3A2E1F]/80 mt-3">
                    New to buying dry fruits online? Start with our{' '}
                    <Link to="/guidelines" className="text-[#D97706] font-semibold hover:underline">
                        Buying &amp; Quality Guidelines
                    </Link>.
                </p>
            </section>

            {/* Buying & storage tips */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">Buying & storage tips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tips.map((t) => {
                        const Icon = t.icon;
                        return (
                            <div key={t.title} className="bg-white border border-[#E8DEC8] rounded-xl p-5">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#F5A623]/15 text-[#D97706] mb-3">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-[#3A2E1F]">{t.title}</h3>
                                <p className="text-xs text-[#3A2E1F]/80 mt-2 leading-relaxed">{t.text}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Shop by category */}
            {categories.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                    <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">Shop by category</h2>
                    <div className="flex flex-wrap gap-2.5">
                        {categories.map((c) => (
                            <Link
                                key={c.id || c.slug}
                                to={`/products/${c.slug}`}
                                className="inline-flex items-center gap-1.5 bg-white border border-[#E8DEC8] rounded-full px-4 py-2 text-sm font-semibold text-[#3A2E1F] hover:border-[#F5A623] hover:text-[#D97706] transition-all"
                            >
                                <Tag className="w-3.5 h-3.5 text-[#D97706]" />
                                {c.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Articles from the blog */}
            {articles.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                    <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">Articles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {articles.map((a) => (
                            <Link
                                key={a.id || a.slug}
                                to={`/blog/${a.slug}`}
                                className="bg-white border border-[#E8DEC8] rounded-xl p-5 hover:border-[#F5A623] hover:shadow-md transition-all"
                            >
                                <h3 className="font-bold text-base text-[#3A2E1F]">{a.title}</h3>
                                {(a.excerpt || a.meta_description) && (
                                    <p className="text-xs text-[#3A2E1F]/80 mt-2 leading-relaxed line-clamp-3">
                                        {a.excerpt || a.meta_description}
                                    </p>
                                )}
                                <span className="inline-flex items-center gap-1 text-xs text-[#D97706] font-semibold mt-3">
                                    Read guide <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick answers / FAQ */}
            {faqs.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                    <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4 flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-[#D97706]" />
                        Quick answers
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                        {faqs.map((f, i) => (
                            <details
                                key={i}
                                className="group bg-white border border-[#E8DEC8] rounded-xl px-5 py-4"
                            >
                                <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-sm text-[#3A2E1F]">
                                    <span>{f.q}</span>
                                    <ArrowRight className="w-4 h-4 text-[#D97706] transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="text-xs text-[#3A2E1F]/80 mt-3 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* Explore by region */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">Explore by region</h2>
                <ul className="flex flex-wrap gap-x-4 gap-y-2.5 text-sm">
                    {regions.map(([slug, loc]) => (
                        <li key={slug}>
                            <Link to={`/${slug}`} className="text-[#D97706] font-semibold hover:underline">{loc.h1}</Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
