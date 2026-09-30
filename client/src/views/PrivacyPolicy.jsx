import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, FileText, RotateCcw, Truck, Lock, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const privacySections = [
    {
        title: 'Information We Collect',
        content: [
            'Name, email address, phone number, shipping and billing address provided during checkout.',
            'Products purchased, order history, and payment method details (we do not store full card numbers).',
            'IP address, browser type, pages visited, and referring URLs collected through cookies and analytics.',
            'Messages sent via our contact form, WhatsApp, or email correspondence.'
        ]
    },
    {
        title: 'How We Use Your Information',
        content: [
            'Processing and fulfilling your orders including delivery and payment.',
            'Sending order confirmations, shipping updates, and delivery notifications.',
            'Responding to inquiries and providing customer support.',
            'Improving our website, products, and services based on usage patterns.',
            'Sending promotional offers and newsletters (only with your consent).',
            'Preventing fraud and ensuring platform security.'
        ]
    },
    {
        title: 'Information Sharing',
        content: [
            'We do not sell, trade, or rent your personal information to third parties.',
            'Delivery Partners — Your name, phone, and address are shared with couriers to fulfill deliveries.',
            'Payment Processors — Payment details are securely transmitted for transaction processing.',
            'Legal Compliance — We may disclose information if required by law.'
        ]
    },
    {
        title: 'Data Security & Cookies',
        content: [
            'SSL/TLS encryption for all data transmitted between your browser and our servers.',
            'Secure payment processing through trusted third-party gateways.',
            'Essential cookies required for cart, login, and checkout functionality.',
            'Analytics cookies to understand how visitors use our site (can be disabled in browser settings).',
            'Access to personal data is restricted to authorized personnel only.'
        ]
    },
    {
        title: 'Your Rights',
        content: [
            'Access the personal data we hold about you.',
            'Request correction of inaccurate or incomplete information.',
            'Request deletion of your data (subject to legal retention requirements).',
            'Opt out of marketing communications at any time.',
            'We retain order records for up to 3 years for accounting and legal purposes.'
        ]
    }
];

const termsSections = [
    {
        title: 'Products & Pricing',
        content: [
            'All products are subject to availability. We may limit quantities or discontinue products without notice.',
            'Prices are in Pakistani Rupees (PKR) and inclusive of applicable taxes unless stated otherwise.',
            'Slight variations in color, size, or weight may occur due to natural characteristics of dry fruits.',
            'We reserve the right to correct pricing errors and will notify you if an order is affected.'
        ]
    },
    {
        title: 'Orders & Payment',
        content: [
            'Placing an order constitutes an offer to purchase — we may cancel due to stock issues or suspected fraud.',
            'We accept Cash on Delivery (COD), bank transfers, and online payments.',
            'For COD orders, full payment is required upon delivery.',
            'All online payments are processed through secure, encrypted channels.'
        ]
    },
    {
        title: 'Shipping & Delivery',
        content: [
            'Nationwide delivery across Pakistan within 2-5 business days.',
            'Shipping charges calculated at checkout based on location and order value.',
            'Tracking number provided via SMS/email once dispatched.',
            'Delivery timelines are estimates — delays may occur due to weather, holidays, or courier issues.',
            'Please ensure someone is available at the delivery address to receive the parcel.'
        ]
    },
    {
        title: 'Cancellation Policy',
        content: [
            'Cancel within 2 hours of placing your order by contacting us via WhatsApp or our Contact page.',
            'Once dispatched, cancellation is not possible — you may refuse delivery and request a return.',
            'We may cancel orders if we suspect fraud, out-of-stock, or pricing errors.'
        ]
    }
];

const refundSections = [
    {
        title: 'Eligible for Return/Refund',
        content: [
            'Product received is damaged, spoiled, or broken during transit.',
            'Wrong product delivered (different from what was ordered).',
            'Product quality does not match the website description.',
            'Sealed product is expired at the time of delivery.'
        ]
    },
    {
        title: 'NOT Eligible for Return/Refund',
        content: [
            'Change of mind after delivery or products opened and consumed.',
            'Products damaged due to improper storage after delivery.',
            'Minor natural variations in size, color, or shape of dry fruits.',
            'Delays caused by courier services or force majeure events.'
        ]
    },
    {
        title: 'How Returns & Refunds Work',
        content: [
            'Contact us within 24 hours of receiving your order with photos/videos of the issue.',
            'Our team reviews your request within 1-2 business days.',
            'Approved refunds processed within 5-7 business days to the original payment method.',
            'For COD orders, refunds issued via bank transfer to your provided account.',
            'Shipping charges are non-refundable unless the issue is our fault.',
            'You may opt for a free replacement instead (subject to stock availability).'
        ]
    }
];

function PolicySection({ sections, startIndex = 1 }) {
    return (
        <div className="space-y-6">
            {sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                    <h3 className="text-base font-bold text-[#3A2E1F] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center text-xs font-bold shrink-0">
                            {startIndex + idx}
                        </span>
                        {section.title}
                    </h3>
                    <ul className="space-y-2 pl-8">
                        {section.content.map((item, i) => (
                            <li key={i} className="text-sm text-[#3A2E1F]/70 leading-relaxed relative before:content-[''] before:absolute before:left-[-16px] before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#F5A623]/40">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default function PrivacyPolicy() {
    const { settings } = useSettings();
    const storeName = settings.store_name || 'North Dry Fruits';

    const tabs = [
        { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
        { id: 'terms', label: 'Terms & Conditions', icon: FileText },
        { id: 'refund', label: 'Refund Policy', icon: RotateCcw }
    ];

    // Allow deep-linking to a specific policy tab via ?tab=terms|refund|privacy
    // so footer links (e.g. "Terms & Conditions") open the right section.
    const [searchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(
        tabs.some((t) => t.id === requestedTab) ? requestedTab : 'privacy'
    );

    // Prefer the configured site_url (matches canonical/@id used site-wide);
    // fall back to the current origin.
    const origin = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

    return (
        <div className="pb-16">
            <SEO
                title={`Policies - ${storeName}`}
                description={`Privacy policy, terms & conditions, and refund policy for ${storeName}.`}
                canonical={`${origin}/privacy`}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${origin}/` },
                        { "@type": "ListItem", "position": 2, "name": "Policies", "item": `${origin}/privacy` }
                    ]
                }}
            />

            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/10 text-[#D97706] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Transparency & Trust</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                            Policies & Terms
                        </h1>
                        <p className="text-sm text-[#3A2E1F]/60 mt-1 max-w-xl">
                            Everything you need to know about how we handle your data, our terms of service, and our return & refund process.
                        </p>
                    </div>
                    <p className="text-xs text-[#3A2E1F]/40">Last updated: August 2026</p>
                </div>
            </section>

            {/* Feature Cards */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-[#3A2E1F]">SSL Encrypted</h3>
                        <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">All your data is protected with industry-standard encryption.</p>
                    </div>
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-[#3A2E1F]">Quality Guaranteed</h3>
                        <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">Every product is quality-checked before it reaches your door.</p>
                    </div>
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-[#3A2E1F]">Nationwide Delivery</h3>
                        <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">Fast delivery across Pakistan within 2-5 business days.</p>
                    </div>
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-[#3A2E1F]">Easy Returns</h3>
                        <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">Hassle-free returns within 24 hours if there's any issue.</p>
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-8">
                <div className="flex flex-wrap gap-2 border-b border-[#E8DEC8] pb-4">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-[#F5A623] text-[#3A2E1F] shadow-sm'
                                        : 'bg-white border border-[#E8DEC8] text-[#3A2E1F]/70 hover:border-[#F5A623] hover:text-[#3A2E1F]'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Content */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8">
                    {activeTab === 'privacy' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Privacy Policy</h2>
                                <p className="text-sm text-[#3A2E1F]/60 mt-1">
                                    How we collect, use, and protect your personal information.
                                </p>
                            </div>
                            <PolicySection sections={privacySections} startIndex={1} />
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Terms & Conditions</h2>
                                <p className="text-sm text-[#3A2E1F]/60 mt-1">
                                    By using our website or placing an order, you agree to these terms.
                                </p>
                            </div>
                            <PolicySection sections={termsSections} startIndex={1} />
                        </div>
                    )}

                    {activeTab === 'refund' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Return & Refund Policy</h2>
                                <p className="text-sm text-[#3A2E1F]/60 mt-1">
                                    We want you to be satisfied. Here's how returns and refunds work.
                                </p>
                            </div>
                            <PolicySection sections={refundSections} startIndex={1} />
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="bg-[#3A2E1F] rounded-2xl p-8 sm:p-12 text-center space-y-4">
                    <Sparkles className="w-6 h-6 text-[#F5A623] mx-auto" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-body text-white leading-tight">
                        Have questions? We're here to help.
                    </h2>
                    <p className="text-sm text-[#F5EFE0]/70 max-w-lg mx-auto">
                        If you need clarification on any of our policies, reach out to us anytime.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl transition-all"
                        >
                            <span>Contact Us</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all border border-white/20"
                        >
                            <span>Shop Now</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
