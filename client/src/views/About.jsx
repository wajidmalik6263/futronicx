import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Award, ShieldCheck, Heart, Truck, Sparkles, ArrowRight, CheckCircle2, Users, MapPin, ClipboardCheck, Package } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../hooks/useCurrency';
import { optimizeImage } from '../utils/imageUrl';

export default function About() {
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();

    const defaultFeatures = [
        { icon: 'Leaf', title: '100% Organic & Natural', description: 'Sun-dried organic dry fruits sourced directly from the mountain orchards of Gilgit-Baltistan.' },
        { icon: 'Users', title: 'Direct From Farmers', description: 'We work directly with local farmers, ensuring fair prices and the freshest harvest reaches you.' },
        { icon: 'ShieldCheck', title: 'Quality Guaranteed', description: 'Every batch is hand-sorted and quality-checked before packaging to ensure premium standards.' },
        { icon: 'Truck', title: 'Nationwide Delivery', description: 'Carefully vacuum-sealed and delivered to your doorstep across Pakistan within 2-3 days.' }
    ];
    const iconMap = { Leaf, Users, ShieldCheck, Truck, Award, Heart, Sparkles, MapPin };
    let features = defaultFeatures;
    try {
        if (settings.about_features) {
            const parsed = typeof settings.about_features === 'string' ? JSON.parse(settings.about_features) : settings.about_features;
            if (Array.isArray(parsed) && parsed.length > 0) features = parsed;
        }
    } catch { /* use defaults */ }

    return (
        <div className="pb-16">
            <SEO
                rawTitle="Pure Organic Heritage from Skardu | About North Dry Fruits"
                description="Learn how we bring 100% fresh, hand-picked organic dry fruits and Shilajit straight from the pristine Gilgit-Baltistan mountains to you."
                canonical={`${window.location.origin}/about`}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": window.location.origin
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "About Us",
                            "item": `${window.location.origin}/about`
                        }
                    ]
                }}
            />

            {/* Header Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{settings.about_badge_text || 'Our Journey & Heritage'}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                            {settings.about_hero_heading || 'Welcome to North Dry Fruits'}
                        </h1>
                        <p className="text-sm text-[#3A2E1F]/80 mt-1 max-w-xl">
                            {settings.about_hero_subheading || 'Bringing 100% authentic, sun-dried organic dry fruits and nuts directly from the mountain farmers of Gilgit-Baltistan to your doorstep across Pakistan.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Brand Story Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="flex flex-col lg:flex-row gap-8 bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8">
                    {/* Story Content */}
                    <div className="flex-1 space-y-5">
                        <span className="text-xs font-bold text-[#92400E] uppercase tracking-widest block">
                            {settings.store_name || 'North Dry Fruits'} Story
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold font-body text-[#3A2E1F] leading-tight">
                            {settings.about_story_heading || 'Sourced From High Altitude Orchards of Gilgit-Baltistan'}
                        </h2>
                        <div className="text-sm text-[#3A2E1F]/80 leading-relaxed whitespace-pre-line">
                            {settings.about_story_text || 'North Dry Fruits was founded with a simple mission — to bring the purest, most nutritious dry fruits from the valleys of Gilgit-Baltistan directly to families across Pakistan.\n\nOur products are hand-picked from high-altitude orchards where the clean mountain air and natural sunlight produce the richest flavors. We work directly with local farmers, cutting out middlemen to ensure freshness, fair pricing, and authenticity in every pack.'}
                        </div>
                        <div className="space-y-2.5 pt-2">
                            <div className="flex items-center gap-3 text-sm font-semibold text-[#3A2E1F]">
                                <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                                <span>{settings.about_bullet_1 || '100% Authentic & Naturally Sun-Dried'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-semibold text-[#3A2E1F]">
                                <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                                <span>{settings.about_bullet_2 || 'Direct From Farmers — No Middlemen'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Story Image */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-[#F5EFE0]">
                            <img
                                src={optimizeImage(settings.about_story_image, { width: 320, height: 240, crop: 'fill' })}
                                alt={settings.about_story_image_alt || 'Premium dry fruits from Gilgit-Baltistan'}
                                className="w-full h-full object-cover"
                                width="320"
                                height="240"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">
                        Why Choose {settings.store_name || 'North Dry Fruits'}?
                    </h2>
                    <p className="text-sm text-[#3A2E1F]/80 mt-1">
                        We prioritize quality, authenticity, and freshness — bringing the best of northern Pakistan to your home.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((item, idx) => {
                        const IconComponent = typeof item.icon === 'string' ? (iconMap[item.icon] || Leaf) : item.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-[#3A2E1F]">{item.title}</h3>
                                <p className="text-xs text-[#3A2E1F]/80 leading-relaxed">{item.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>




            {/* Our Process Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-14">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Left Content */}
                    <div className="w-full lg:w-2/5 space-y-5">
                        <span className="inline-block px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider">
                            Our Process
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F] leading-tight">
                            Quality is protected at every step.
                        </h2>
                        <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                            From the moment a product is selected to the day it reaches your doorstep, our process is designed to keep the product clean, traceable, and fresh.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl transition-all"
                        >
                            <span>Explore Products</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Right Steps Grid */}
                    <div className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#92400E] uppercase">Step 01</span>
                                <MapPin className="w-5 h-5 text-[#3A2E1F]/40" />
                            </div>
                            <h3 className="font-bold text-lg text-[#3A2E1F]">Source</h3>
                            <p className="text-xs text-[#3A2E1F]/80 leading-relaxed">
                                We select trusted growers from Skardu, Hunza, Gilgit, and Baltistan.
                            </p>
                        </div>
                        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#92400E] uppercase">Step 02</span>
                                <ClipboardCheck className="w-5 h-5 text-[#3A2E1F]/40" />
                            </div>
                            <h3 className="font-bold text-lg text-[#3A2E1F]">Inspect</h3>
                            <p className="text-xs text-[#3A2E1F]/80 leading-relaxed">
                                Each batch is checked for freshness, purity, and product consistency.
                            </p>
                        </div>
                        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#92400E] uppercase">Step 03</span>
                                <Package className="w-5 h-5 text-[#3A2E1F]/40" />
                            </div>
                            <h3 className="font-bold text-lg text-[#3A2E1F]">Pack</h3>
                            <p className="text-xs text-[#3A2E1F]/80 leading-relaxed">
                                Products are sealed with care to preserve their natural mountain flavor.
                            </p>
                        </div>
                        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#92400E] uppercase">Step 04</span>
                                <Truck className="w-5 h-5 text-[#3A2E1F]/40" />
                            </div>
                            <h3 className="font-bold text-lg text-[#3A2E1F]">Deliver</h3>
                            <p className="text-xs text-[#3A2E1F]/80 leading-relaxed">
                                Your order is dispatched nationwide with reliable delivery support.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Source Regions Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-14">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <span className="inline-block px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                            Source Regions
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F] leading-tight">
                            Sourced from pristine northern valleys.
                        </h2>
                    </div>
                    <p className="text-sm text-[#3A2E1F]/80 max-w-md">
                        Each region has its own growing conditions, harvest traditions, and signature products.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: 'Skardu', altitude: '2,228m', products: 'Almonds, walnuts, apricots' },
                        { name: 'Hunza Valley', altitude: '2,400m', products: 'Apricots, mulberries, honey' },
                        { name: 'Gilgit', altitude: '1,500m', products: 'Dry fruits, shilajit, honey' },
                        { name: 'Baltistan', altitude: '2,500m', products: 'Organic nuts, apricots, dry fruits' }
                    ].map((region, idx) => (
                        <div key={idx} className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3 hover:border-[#F5A623] hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 text-[#D97706] flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-base text-[#3A2E1F]">{region.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-[#3A2E1F]/80">
                                <span>Altitude {region.altitude}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[#3A2E1F]/80">{region.products}</p>
                                <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA Banner */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="bg-[#3A2E1F] rounded-2xl p-8 sm:p-12 text-center space-y-4">
                    <Sparkles className="w-6 h-6 text-[#F5A623] mx-auto" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-body text-white leading-tight">
                        Taste the real freshness of Gilgit-Baltistan.
                    </h2>
                    <p className="text-sm text-[#F5EFE0]/70 max-w-lg mx-auto">
                        Explore premium dry fruits and natural products, packed fresh and delivered across Pakistan.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl transition-all"
                        >
                            <span>Shop Now</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all border border-white/20"
                        >
                            <span>Contact Us</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
