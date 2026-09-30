import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { getFaqs } from '../utils/infoPages';

// Store-wide FAQ page. Copy is settings-driven (getFaqs) so it always matches
// the values shown elsewhere and never states an invented figure.
export default function FaqPage() {
    const { settings } = useSettings();
    const faqs = getFaqs(settings || {});
    const storeName = (settings && settings.store_name) || 'North Dry Fruits';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/faq`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
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
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: 'FAQ', item: canonical },
                ],
            },
        ],
    };

    return (
        <div className="pb-16">
            <SEO
                rawTitle={`Frequently Asked Questions | ${storeName}`}
                description="Answers to common questions about ordering, sourcing, shipping, payment, returns and tracking at North Dry Fruits."
                canonical={canonical}
                structuredData={structuredData}
            />

            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Help & Support</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                    Frequently Asked Questions
                </h1>
                <p className="text-sm text-[#3A2E1F]/80 mt-2 max-w-2xl">
                    Common questions about ordering, sourcing, shipping, payment and returns at {storeName}.
                </p>
            </section>

            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-5xl items-start">
                    {faqs.map((f, i) => (
                        <details key={i} className="group border border-[#E8DEC8] rounded-2xl bg-[#FFFDF9] overflow-hidden">
                            <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-4 text-sm sm:text-base font-bold text-[#3A2E1F] font-body list-none">
                                <span>{f.q}</span>
                                <svg
                                    className="shrink-0 w-5 h-5 text-[#D97706] transition-transform duration-200 group-open:rotate-180"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </summary>
                            <div className="px-5 pb-4 text-sm text-[#3A2E1F]/80 leading-relaxed">{f.a}</div>
                        </details>
                    ))}
                </div>
            </section>

            <section className="w-full px-4 sm:px-8 lg:px-16">
                <div className="flex flex-wrap gap-4 text-sm">
                    <Link to="/shipping" className="text-[#D97706] font-semibold hover:underline">Shipping & delivery</Link>
                    <Link to="/contact" className="text-[#D97706] font-semibold hover:underline">Contact us</Link>
                    <Link to="/products" className="text-[#D97706] font-semibold hover:underline">Browse products</Link>
                </div>
            </section>
        </div>
    );
}
