import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import NotFound from './NotFound';
import { getLocationSeo } from '../utils/locationSeo';
import { getLocation } from '../api/locations';

// Region landing page (/dry-fruits-pakistan, /dry-fruits-skardu, ...).
// SEO copy comes from the local locationSeo mirror so <head> + visible copy
// render immediately and match the server-side prerender exactly. Products are
// fetched from /api/locations/:slug — only products whose stored `origin`
// matches the region are returned (no fabricated origins).
export default function LocationPage() {
    // The route is registered per-slug, so derive the slug from the pathname.
    const { pathname } = useLocation();
    const slug = pathname.replace(/^\/+|\/+$/g, '');
    const seo = getLocationSeo(slug);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getLocation(slug)
            .then((data) => { if (active) setProducts(data.products || []); })
            .catch(() => { if (active) setProducts([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slug]);

    // Unknown slug -> render the normal 404 UI (server already sends 404 status).
    if (!seo) return <NotFound />;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/${slug}`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': canonical,
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
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: seo.h1, item: canonical },
                ],
            },
            ...(seo.faqs && seo.faqs.length
                ? [{
                    '@type': 'FAQPage',
                    mainEntity: seo.faqs.map((f) => ({
                        '@type': 'Question',
                        name: f.q,
                        acceptedAnswer: { '@type': 'Answer', text: f.a },
                    })),
                }]
                : []),
            ...(products.length
                ? [{
                    '@type': 'ItemList',
                    numberOfItems: products.length,
                    itemListElement: products.map((p, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        url: `${origin}/product/${p.slug}`,
                        name: p.name,
                    })),
                }]
                : []),
        ],
    };

    return (
        <div className="pb-16">
            <SEO
                rawTitle={seo.title}
                description={seo.description}
                canonical={canonical}
                structuredData={structuredData}
            />

            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{seo.region}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">{seo.h1}</h1>
                <div className="mt-3 space-y-2 max-w-3xl">
                    {seo.intro.map((p, i) => (
                        <p key={i} className="text-sm text-[#3A2E1F]/80 leading-relaxed">{p}</p>
                    ))}
                </div>
            </section>

            {/* Products from this region */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">
                    Products from {seo.region}
                </h2>

                {loading ? (
                    <p className="text-sm text-[#3A2E1F]/70">Loading products…</p>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((p) => (
                            <ProductCard key={p.id || p.slug} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-6">
                        <p className="text-sm text-[#3A2E1F]/80">
                            We\u2019re currently updating our {seo.region} selection.{' '}
                            <Link to="/products" className="text-[#D97706] font-semibold hover:underline">
                                Browse all products
                            </Link>{' '}
                            in the meantime.
                        </p>
                    </div>
                )}
            </section>

            {/* FAQ */}
            {seo.faqs && seo.faqs.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                    <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4">
                        Frequently asked questions
                    </h2>
                    <div className="space-y-3 max-w-3xl">
                        {seo.faqs.map((f, i) => (
                            <div key={i} className="bg-white border border-[#E8DEC8] rounded-xl p-5">
                                <h3 className="font-bold text-base text-[#3A2E1F]">{f.q}</h3>
                                <p className="text-sm text-[#3A2E1F]/80 mt-1 leading-relaxed">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="bg-[#3A2E1F] rounded-2xl p-8 text-center space-y-4">
                    <h2 className="text-2xl font-extrabold font-body text-white">
                        Shop premium dry fruits and nuts
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl transition-all">
                            <span>Shop Now</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all border border-white/20">
                            <span>About Us</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
