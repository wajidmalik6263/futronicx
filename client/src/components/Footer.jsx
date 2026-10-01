import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Send, Heart, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getCategories } from '../api/categories';
import { optimizeImage } from '../utils/imageUrl';

// Brand social icons as inline SVGs (lucide-react no longer ships brand marks).
const FacebookIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
);
const InstagramIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);
const TwitterIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.6l-5.17-6.76L4.8 22H1.54l8.02-9.17L1.5 2h6.77l4.67 6.18L18.244 2Zm-1.16 18h1.83L7.02 3.9H5.06L17.084 20Z" />
    </svg>
);
const YoutubeIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
);
const LinkedinIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
);
const WhatsAppIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35ZM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.92C21.95 6.45 17.5 2 12.04 2Z" />
    </svg>
);

export default function Footer() {
    const { settings } = useSettings();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Link all categories from the footer (not just a few) so every
        // category has a site-wide internal link. Cap generously to avoid an
        // unwieldy footer if the catalog grows very large.
        getCategories().then(cats => setCategories((cats || []).slice(0, 12))).catch(() => { });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    // Normalize a WhatsApp number into a wa.me link
    const waNumber = (settings.social_whatsapp || '').replace(/[^\d]/g, '');

    // Social links wired to configurable settings. Only rendered when a value is set.
    const socialLinks = [
        { key: 'facebook', href: settings.social_facebook, Icon: FacebookIcon, label: 'Facebook', color: '#1877F2' },
        { key: 'instagram', href: settings.social_instagram, Icon: InstagramIcon, label: 'Instagram', color: '#E4405F' },
        { key: 'twitter', href: settings.social_twitter, Icon: TwitterIcon, label: 'X (Twitter)', color: '#000000' },
        { key: 'youtube', href: settings.social_youtube, Icon: YoutubeIcon, label: 'YouTube', color: '#FF0000' },
        { key: 'linkedin', href: settings.social_linkedin, Icon: LinkedinIcon, label: 'LinkedIn', color: '#0A66C2' },
        { key: 'whatsapp', href: waNumber ? `https://wa.me/${waNumber}` : '', Icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366' },
    ].filter(link => link.href && link.href.trim() !== '');

    return (
        <footer role="contentinfo" className="relative bg-[#3A2E1F] text-[#F5EFE0] mt-auto border-t border-[#D97706]/20">
            {/* Features Bar */}
            <div className="border-b border-[#F5EFE0]/10 bg-[#3A2E1F]/90 py-5 sm:py-8">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="flex items-center justify-start gap-4">
                        <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-2xl">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold font-body text-lg text-white">{settings.footer_feature_1_title || 'Free Express Shipping'}</p>
                            <p className="text-xs text-[#F5EFE0]/70">{settings.footer_feature_1_text || 'Free on all orders — no charges'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-start gap-4">
                        <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-2xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold font-body text-lg text-white">{settings.footer_feature_2_title || '100% Quality Guaranteed'}</p>
                            <p className="text-xs text-[#F5EFE0]/70">{settings.footer_feature_2_text || 'Direct from trusted sources'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-start gap-4">
                        <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-2xl">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold font-body text-lg text-white">{settings.footer_feature_3_title || '7-Day Fresh Guarantee'}</p>
                            <p className="text-xs text-[#F5EFE0]/70">{settings.footer_feature_3_text || '100% money back or replacement'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Links */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center justify-start gap-2">
                            {settings.footer_logo_url && !settings.footer_logo_url.includes('placeholder') ? (
                                <img src={optimizeImage(settings.footer_logo_url, { width: 192, height: 48, dpr: 1.5 })} alt={settings.store_name} width="192" height="48" loading="lazy" decoding="async" className="h-12 object-contain object-left" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-[#F5A623] flex items-center justify-center text-[#3A2E1F]">
                                        <Leaf className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold font-body text-white">
                                            {settings.store_name || 'North Dry Fruits'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </Link>
                        <p className="text-sm text-[#F5EFE0]/80 leading-relaxed">
                            {settings.footer_about_text || 'Your trusted destination for premium quality products, carefully sourced and delivered to your doorstep.'}
                        </p>

                        {/* Social Media Icons */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-3 pt-1">
                                {socialLinks.map(({ key, href, Icon, label, color }) => (
                                    <a
                                        key={key}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        title={label}
                                        style={{ backgroundColor: color, color: '#ffffff' }}
                                        className="w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h2 className="text-lg font-bold font-body text-white mb-4 text-[#F5A623]">Product Categories</h2>
                        <ul className="flex flex-wrap gap-x-4 gap-y-2.5 sm:block sm:space-y-2.5 text-sm text-[#F5EFE0]/80">
                            {categories.length > 0 ? categories.map(cat => (
                                <li key={cat.id || cat.slug}><Link to={`/products/${cat.slug}`} className="hover:text-[#F5A623] transition-colors">{cat.name}</Link></li>
                            )) : (
                                <li><Link to="/products" className="hover:text-[#F5A623] transition-colors">Browse All Products</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Navigation & Info */}
                    <div>
                        <h2 className="text-lg font-bold font-body text-white mb-4 text-[#F5A623]">Company & Support</h2>
                        <ul className="flex flex-wrap gap-x-4 gap-y-2.5 sm:block sm:space-y-2.5 text-sm text-[#F5EFE0]/80">
                            <li><Link to="/about" className="hover:text-[#F5A623] transition-colors">About {settings.store_name || 'North Dry Fruits'}</Link></li>
                            <li><Link to="/contact" className="hover:text-[#F5A623] transition-colors">Contact Us</Link></li>
                            <li><Link to="/blog" className="hover:text-[#F5A623] transition-colors">Blog</Link></li>
                            <li><Link to="/guides" className="hover:text-[#F5A623] transition-colors">Guides</Link></li>
                            <li><Link to="/faq" className="hover:text-[#F5A623] transition-colors">FAQ</Link></li>
                            <li><Link to="/shipping" className="hover:text-[#F5A623] transition-colors">Shipping &amp; Delivery</Link></li>
                            <li><Link to="/track-order" className="hover:text-[#F5A623] transition-colors">Track Order</Link></li>
                            <li><Link to="/products" className="hover:text-[#F5A623] transition-colors">Browse All Products</Link></li>
                            <li><Link to="/privacy" className="hover:text-[#F5A623] transition-colors">Privacy &amp; Policies</Link></li>
                        </ul>
                    </div>

                    {/* Shop by Region */}
               

                    {/* Newsletter Signup Form */}
                    <div>
                        <h2 className="text-lg font-bold font-body text-white mb-2 text-[#F5A623]">Stay Connected</h2>
                        <p className="text-sm text-[#F5EFE0]/80 mb-4">
                            Subscribe to get exclusive discounts and updates.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-3" aria-label="Newsletter signup">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    aria-label="Email address for newsletter"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F5EFE0]/10 border border-[#F5EFE0]/20 rounded-full text-white placeholder-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                />
                                <Mail className="w-4 h-4 text-[#F5EFE0]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-semibold text-sm rounded-full shadow-sm transition-all duration-200"
                            >
                                <span>Subscribe</span>
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[#F5EFE0]/10 bg-[#2A2116] py-6">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#F5EFE0]/80">
                    <p>© {new Date().getFullYear()} {settings.store_name || 'North Dry Fruits'}. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy?tab=privacy" className="hover:text-[#F5A623] transition-colors duration-200">
                            Privacy Policy
                        </Link>
                        <Link to="/privacy?tab=terms" className="hover:text-[#F5A623] transition-colors duration-200">
                            Terms & Conditions
                        </Link>
                        <Link to="/privacy?tab=refund" className="hover:text-[#F5A623] transition-colors duration-200">
                            Refund Policy
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                       
                    </div>
                </div>
            </div>
        </footer>
    );
}
