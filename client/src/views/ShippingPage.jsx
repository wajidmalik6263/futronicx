import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Clock, BadgeDollarSign, CreditCard, PackageSearch, RotateCcw, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { getShippingSections } from '../utils/infoPages';

// Maps a section heading to an icon + accent colour so each card reads at a
// glance. Falls back to a neutral truck icon for any unknown heading.
const SECTION_STYLES = {
    'Where we deliver': { Icon: MapPin, tint: '#16A34A', bg: '#16A34A15' },
    'Delivery time': { Icon: Clock, tint: '#2563EB', bg: '#2563EB15' },
    'Shipping cost': { Icon: BadgeDollarSign, tint: '#D97706', bg: '#D9770615' },
    'Payment methods': { Icon: CreditCard, tint: '#7C3AED', bg: '#7C3AED15' },
    'Order tracking': { Icon: PackageSearch, tint: '#0891B2', bg: '#0891B215' },
    'Returns': { Icon: RotateCcw, tint: '#DC2626', bg: '#DC262615' },
};

// Shipping & delivery page. Sections are settings-driven so figures always
// match the store configuration (no invented fees or timelines).
export default function ShippingPage() {
    const { settings } = useSettings();
    const sections = getShippingSections(settings || {});
    const storeName = (settings && settings.store_name) || 'North Dry Fruits';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/shipping`;

    // Expose the shipping sections as FAQ-style Q&A for rich results, phrased
    // as questions to keep them eligible.
    const faqEntities = sections.map((sec) => ({
        '@type': 'Question',
        name: sec.heading,
        acceptedAnswer: { '@type': 'Answer', text: (sec.paragraphs || []).join(' ') },
    }));

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': canonical,
                name: 'Shipping & Delivery',
                description: 'How North Dry Fruits ships orders across Pakistan: areas served, delivery times, costs, payment methods, tracking and returns.',
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: 'Shipping & Delivery', item: canonical },
                ],
            },
            { '@type': 'FAQPage', mainEntity: faqEntities },
        ],
    };

    return (
        <div className="pb-16">
            <SEO
                rawTitle={`Shipping & Delivery Across Pakistan | ${storeName}`}
                description="How North Dry Fruits ships orders across Pakistan: areas served, delivery times, costs, payment methods, order tracking and returns."
                canonical={canonical}
                structuredData={structuredData}
            />

            {/* Hero */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-10 pb-8 bg-gradient-to-b from-[#F5A623]/10 to-transparent">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/20 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Shipping & Delivery</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-body text-[#3A2E1F]">
                        Shipping & Delivery
                    </h1>
                    <p className="text-base text-[#3A2E1F]/70 mt-3 max-w-xl mx-auto">
                        How {storeName} delivers orders across Pakistan — fast, free and fully trackable.
                    </p>
                </div>
            </section>

            {/* Section cards */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                    {sections.map((sec, i) => {
                        const style = SECTION_STYLES[sec.heading] || { Icon: Truck, tint: '#D97706', bg: '#D9770615' };
                        const { Icon } = style;
                        return (
                            <div
                                key={i}
                                className="group bg-white border border-[#E8DEC8] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#F5A623]/50"
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: style.bg }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: style.tint }} />
                                </div>
                                <h2 className="font-bold text-base text-[#3A2E1F] mb-2">{sec.heading}</h2>
                                {(sec.paragraphs || []).map((p, j) => (
                                    <p key={j} className="text-sm text-[#3A2E1F]/70 leading-relaxed">{p}</p>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA links */}
            <section className="w-full px-4 sm:px-8 lg:px-16">
                <div className="max-w-5xl mx-auto bg-[#3A2E1F] rounded-2xl px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Still have questions?</h3>
                        <p className="text-sm text-white/70 mt-1">Check our FAQ, track an order, or start shopping.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/faq" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
                            FAQ
                        </Link>
                        <Link to="/track-order" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
                            Track your order
                        </Link>
                        <Link to="/products" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F5A623] text-[#3A2E1F] text-sm font-bold hover:bg-[#e5991f] transition-colors">
                            Browse products
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
