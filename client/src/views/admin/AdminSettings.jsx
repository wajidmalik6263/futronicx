import React, { useState, useRef } from 'react';
import {
    Store,
    Mail,
    Phone,
    MapPin,
    Image as ImageIcon,
    UploadCloud,
    Share2,
    Sliders,
    Globe,
    Check,
    Save,
    RefreshCw,
    Sparkles,
    DollarSign,
    Truck,
    Info,
    LayoutTemplate,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/api';

export default function AdminSettings() {
    const { settings, updateSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

    // Form state pre-filled from global settings context
    const [formData, setFormData] = useState({
        // General
        storeName: settings.store_name || '',
        storeTagline: settings.store_tagline || '',
        siteBaseUrl: settings.site_url || '',
        logoPreview: settings.logo_url || '/placeholder.png',
        faviconPreview: settings.favicon_url || '/vite.svg',

        // Footer Logo
        footerLogoPreview: settings.footer_logo_url || '/placeholder.png',

        // Contact Info
        contactEmail: settings.contact_email || '',
        contactPhone: settings.contact_phone || '',
        contactAddress: settings.contact_address || '',
        workingHours: settings.working_hours || 'Mon - Sat: 9:00 AM - 8:00 PM (PKT)',
        mapEmbedUrl: settings.map_embed_url || 'https://www.google.com/maps/embed?pb=...',



        // Social Links
        facebookUrl: settings.social_facebook || '',
        instagramUrl: settings.social_instagram || '',
        twitterUrl: settings.social_twitter || '',
        youtubeUrl: settings.social_youtube || '',
        linkedinUrl: settings.social_linkedin || '',
        whatsappNumber: settings.social_whatsapp || '',

        // Footer
        footerAboutText: settings.footer_about_text || '',

        // Store Settings
        currencySymbol: settings.currency_symbol || '',
        currencyCode: settings.currency_code || 'PKR',
        freeShippingThreshold: settings.free_shipping_threshold || '',
        defaultShippingFee: settings.default_shipping_fee || '',
        shippingInfoText: settings.shipping_info_text || '',
        shippingTabHeading: settings.shipping_tab_heading || '',
        shippingBullet1: settings.shipping_bullet_1 || '',
        shippingBullet2: settings.shipping_bullet_2 || '',
        shippingBullet3: settings.shipping_bullet_3 || '',
        shippingBullet4: settings.shipping_bullet_4 || '',
        orderPrefix: settings.order_prefix || 'GB',
        skuPrefix: settings.sku_prefix || 'GBM',
        phonePattern: settings.phone_pattern || '',
        phonePlaceholder: settings.phone_placeholder || '',
        searchPlaceholder: settings.search_placeholder || '',
        chatbotName: settings.chatbot_name || '',
        footerTagline: settings.footer_tagline || '',
        footerFeature1Title: settings.footer_feature_1_title || '',
        footerFeature1Text: settings.footer_feature_1_text || '',
        footerFeature2Title: settings.footer_feature_2_title || '',
        footerFeature2Text: settings.footer_feature_2_text || '',
        footerFeature3Title: settings.footer_feature_3_title || '',
        footerFeature3Text: settings.footer_feature_3_text || '',
        productBadgeText: settings.product_badge_text || '',
        emptyCartText: settings.empty_cart_text || '',
        locale: settings.locale || 'en_PK',

        // Static Pages CMS
        privacyPolicyContent: settings.privacy_policy_content || '',
        aboutHeroHeading: settings.about_hero_heading || '',
        aboutHeroSubheading: settings.about_hero_subheading || '',
        aboutStoryHeading: settings.about_story_heading || '',
        aboutStoryText: settings.about_story_text || '',
        aboutStoryImagePreview: settings.about_story_image || 'https://images.unsplash.com/photo-1596769062638-e6ed3f46f496?auto=format&fit=crop&q=80&w=800'
    });

    const logoInputRef = useRef(null);
    const faviconInputRef = useRef(null);
    const footerLogoInputRef = useRef(null);
    const aboutStoryImageRef = useRef(null);

    // Tab items configuration
    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'contact', label: 'Contact Info', icon: Mail },
        { id: 'social', label: 'Social Links', icon: Share2 },
        { id: 'footer', label: 'Footer', icon: Info },
        { id: 'about', label: 'About Info', icon: LayoutTemplate },
        { id: 'privacy', label: 'Privacy Policies', icon: LayoutTemplate },
        { id: 'store', label: 'Store Settings', icon: Sliders },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, logoPreview: previewUrl }));
            toast.success('Logo preview updated!');
        }
    };

    const handleFaviconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, faviconPreview: previewUrl }));
            toast.success('Favicon preview updated!');
        }
    };

    const handleFooterLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, footerLogoPreview: previewUrl }));
            toast.success('Footer logo preview updated!');
        }
    };

    const handleAboutStoryImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, aboutStoryImagePreview: previewUrl }));
            toast.success('About Story Image preview updated!');
        }
    };



    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            let finalLogoUrl = formData.logoPreview;
            if (logoInputRef.current && logoInputRef.current.files[0]) {
                const fd = new FormData();
                fd.append('image', logoInputRef.current.files[0]);
                const { data } = await api.post('/upload', fd);
                finalLogoUrl = data.url;
            }

            let finalFooterLogoUrl = formData.footerLogoPreview;
            if (footerLogoInputRef.current && footerLogoInputRef.current.files[0]) {
                const fd = new FormData();
                fd.append('image', footerLogoInputRef.current.files[0]);
                const { data } = await api.post('/upload', fd);
                finalFooterLogoUrl = data.url;
            }

            let finalFaviconUrl = formData.faviconPreview;
            if (faviconInputRef.current && faviconInputRef.current.files[0]) {
                const fd = new FormData();
                fd.append('image', faviconInputRef.current.files[0]);
                const { data } = await api.post('/upload', fd);
                finalFaviconUrl = data.url;
            }

            let finalAboutStoryImage = formData.aboutStoryImagePreview;
            if (aboutStoryImageRef.current && aboutStoryImageRef.current.files[0]) {
                const fd = new FormData();
                fd.append('image', aboutStoryImageRef.current.files[0]);
                const { data } = await api.post('/upload', fd);
                finalAboutStoryImage = data.url;
            }

            const payload = {
                store_name: formData.storeName,
                store_tagline: formData.storeTagline,
                site_url: formData.siteBaseUrl,
                logo_url: finalLogoUrl,
                favicon_url: finalFaviconUrl,
                footer_logo_url: finalFooterLogoUrl,
                contact_email: formData.contactEmail,
                contact_phone: formData.contactPhone,
                contact_address: formData.contactAddress,
                working_hours: formData.workingHours,
                map_embed_url: formData.mapEmbedUrl,

                social_facebook: formData.facebookUrl,
                social_instagram: formData.instagramUrl,
                social_twitter: formData.twitterUrl,
                social_youtube: formData.youtubeUrl,
                social_linkedin: formData.linkedinUrl,
                social_whatsapp: formData.whatsappNumber,
                footer_about_text: formData.footerAboutText,
                currency_symbol: formData.currencySymbol,
                currency_code: formData.currencyCode,
                free_shipping_threshold: formData.freeShippingThreshold,
                default_shipping_fee: formData.defaultShippingFee,
                shipping_info_text: formData.shippingInfoText,
                shipping_tab_heading: formData.shippingTabHeading,
                shipping_bullet_1: formData.shippingBullet1,
                shipping_bullet_2: formData.shippingBullet2,
                shipping_bullet_3: formData.shippingBullet3,
                shipping_bullet_4: formData.shippingBullet4,
                order_prefix: formData.orderPrefix,
                sku_prefix: formData.skuPrefix,
                phone_pattern: formData.phonePattern,
                phone_placeholder: formData.phonePlaceholder,
                search_placeholder: formData.searchPlaceholder,
                chatbot_name: formData.chatbotName,
                footer_tagline: formData.footerTagline,
                footer_feature_1_title: formData.footerFeature1Title,
                footer_feature_1_text: formData.footerFeature1Text,
                footer_feature_2_title: formData.footerFeature2Title,
                footer_feature_2_text: formData.footerFeature2Text,
                footer_feature_3_title: formData.footerFeature3Title,
                footer_feature_3_text: formData.footerFeature3Text,
                product_badge_text: formData.productBadgeText,
                empty_cart_text: formData.emptyCartText,
                locale: formData.locale,
                privacy_policy_content: formData.privacyPolicyContent,
                about_hero_heading: formData.aboutHeroHeading,
                about_hero_subheading: formData.aboutHeroSubheading,
                about_story_heading: formData.aboutStoryHeading,
                about_story_text: formData.aboutStoryText,
                about_story_image: finalAboutStoryImage
            };

            await updateSettings(payload);
            toast.success('Settings saved successfully!');
            setFormData(prev => ({
                ...prev,
                logoPreview: finalLogoUrl,

                faviconPreview: finalFaviconUrl,
                footerLogoPreview: finalFooterLogoUrl
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-24">

            {/* STICKY TOP ACTION BAR */}
            <div className="sticky top-[65px] md:top-[73px] z-20 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E8DEC8] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs transition-all">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#3A2E1F] flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-[#D97706]" />
                        <span>Site Settings</span>
                    </h1>
                    <p className="text-[11px] text-[#3A2E1F]/70 hidden sm:block">
                        Configure store metadata, contact details, hero banner, and operational defaults
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-extrabold text-xs rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* MAIN SETTINGS CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT TAB NAVIGATION */}
                <div className="lg:col-span-3 bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-3 sm:p-4 shadow-sm lg:sticky lg:top-36 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A2E1F]/50 px-3 py-1.5 block">
                        Settings Sections
                    </span>

                    {/* MOBILE DROPDOWN: collapsed shows active tab; expands to full list */}
                    <div className="lg:hidden relative">
                        <button
                            type="button"
                            onClick={() => setIsTabMenuOpen(prev => !prev)}
                            aria-expanded={isTabMenuOpen}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold w-full bg-[#F5A623] text-[#3A2E1F] shadow-xs"
                        >
                            {(() => {
                                const current = tabs.find(t => t.id === activeTab) || tabs[0];
                                const Icon = current.icon;
                                return (
                                    <>
                                        <Icon className="w-4 h-4 shrink-0 text-[#3A2E1F]" />
                                        <span>{current.label}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isTabMenuOpen ? 'rotate-180' : ''}`} />
                                    </>
                                );
                            })()}
                        </button>

                        {isTabMenuOpen && (
                            <div className="absolute left-0 right-0 mt-1 z-30 bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-2 shadow-lg space-y-1">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsTabMenuOpen(false);
                                            }}
                                            className={`
                                                flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left w-full
                                                ${isActive
                                                    ? 'bg-[#F5A623] text-[#3A2E1F] shadow-xs'
                                                    : 'text-[#3A2E1F]/70 hover:bg-[#F5EFE0]/60 hover:text-[#3A2E1F]'
                                                }
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3A2E1F]' : 'text-[#D97706]'}`} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* DESKTOP: full vertical list */}
                    <nav className="hidden lg:flex lg:flex-col gap-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 text-left w-full
                                        ${isActive
                                            ? 'bg-[#F5A623] text-[#3A2E1F] shadow-xs'
                                            : 'text-[#3A2E1F]/70 hover:bg-[#F5EFE0]/60 hover:text-[#3A2E1F]'
                                        }
                                    `}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3A2E1F]' : 'text-[#D97706]'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* RIGHT CONTENT FORMS */}
                <div className="lg:col-span-9 space-y-8">
                    <form onSubmit={handleSaveSettings}>

                        {/* GENERAL SETTINGS */}
                        {activeTab === 'general' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <Store className="w-5 h-5 text-[#D97706]" /> General Store Details
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Basic store identity, brand tagline, and logo branding
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    {/* Store Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Store Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.storeName}
                                            onChange={(e) => handleInputChange('storeName', e.target.value)}
                                            placeholder="e.g. My Store"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    {/* Store Tagline */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Store Tagline
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.storeTagline}
                                            onChange={(e) => handleInputChange('storeTagline', e.target.value)}
                                            placeholder="Enter brand tagline..."
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    {/* Site Base URL */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Site Base URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.siteBaseUrl}
                                            onChange={(e) => handleInputChange('siteBaseUrl', e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    {/* Additional General Settings */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Locale (SEO base)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.locale}
                                                onChange={(e) => handleInputChange('locale', e.target.value)}
                                                placeholder="en_PK"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Search Placeholder Text
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.searchPlaceholder}
                                                onChange={(e) => handleInputChange('searchPlaceholder', e.target.value)}
                                                placeholder="Search products..."
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>
                                    </div>

                                    {/* Logo Upload Area */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Store Branding Logo
                                        </label>
                                        <input
                                            type="file"
                                            ref={logoInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoChange}
                                        />
                                        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl">
                                            <div className="w-24 h-24 rounded-2xl bg-white border border-[#E8DEC8] p-2 flex items-center justify-center shrink-0 shadow-xs">
                                                <img
                                                    src={formData.logoPreview}
                                                    alt="Store Logo Preview"
                                                    className="max-h-full max-w-full object-contain rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2 text-center sm:text-left flex-1">
                                                <h4 className="text-xs font-bold text-[#3A2E1F]">Current Brand Mark</h4>
                                                <p className="text-[11px] text-[#3A2E1F]/60">
                                                    PNG, WEBP, or SVG recommended with transparent background.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-xs transition-all"
                                                >
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                    <span>Replace Logo</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Favicon Upload Area */}
                                    <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Store Favicon
                                        </label>
                                        <input
                                            type="file"
                                            ref={faviconInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFaviconChange}
                                        />
                                        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl">
                                            <div className="w-16 h-16 rounded-xl bg-white border border-[#E8DEC8] p-2 flex items-center justify-center shrink-0 shadow-xs">
                                                <img
                                                    src={formData.faviconPreview}
                                                    alt="Store Favicon Preview"
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            </div>
                                            <div className="space-y-2 text-center sm:text-left flex-1">
                                                <h4 className="text-xs font-bold text-[#3A2E1F]">Browser Tab Icon</h4>
                                                <p className="text-[11px] text-[#3A2E1F]/60">
                                                    Ideal size: 32x32px or 64x64px. SVG, PNG or ICO.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => faviconInputRef.current?.click()}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-xs transition-all"
                                                >
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                    <span>Upload Favicon</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTACT INFO */}
                        {activeTab === 'contact' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-[#D97706]" /> Contact & Physical Location
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Customer support channels and business address shown on storefront
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Contact Phone / Helpline
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.contactPhone}
                                                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Physical Store Address
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.contactAddress}
                                            onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Working Hours
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.workingHours}
                                            onChange={(e) => handleInputChange('workingHours', e.target.value)}
                                            placeholder="e.g. Mon - Sat: 9am - 8pm"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Google Maps Embed URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.mapEmbedUrl}
                                            onChange={(e) => handleInputChange('mapEmbedUrl', e.target.value)}
                                            placeholder="https://www.google.com/maps/embed?pb=..."
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                        <p className="text-[10px] text-[#3A2E1F]/60">Got to Google Maps {'->'} Share {'->'} Embed a map {'->'} Copy the HTML `src` link ONLY.</p>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* SOCIAL LINKS */}
                        {activeTab === 'social' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-[#D97706]" /> Social Profiles & Messaging
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Connect storefront icons to your social media channels
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Facebook Page URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.facebookUrl}
                                            onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                                            placeholder="https://facebook.com/yourpage"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Instagram Handle / URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.instagramUrl}
                                            onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                                            placeholder="https://instagram.com/yourhandle"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            X (Twitter) URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.twitterUrl}
                                            onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                                            placeholder="https://x.com/yourhandle"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            YouTube Channel URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.youtubeUrl}
                                            onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                                            placeholder="https://youtube.com/@yourchannel"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            LinkedIn URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.linkedinUrl}
                                            onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                                            placeholder="https://linkedin.com/company/yourpage"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            WhatsApp Contact / Order Hotline
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.whatsappNumber}
                                            onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                                            placeholder="+1 234 567 8900"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Chatbot Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.chatbotName}
                                            onChange={(e) => handleInputChange('chatbotName', e.target.value)}
                                            placeholder="AI Assistant"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FOOTER */}
                        {activeTab === 'footer' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <Info className="w-5 h-5 text-[#D97706]" /> Storefront Footer Content
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Short blurb rendered in the bottom footer column
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            About Text (Short Paragraph)
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={formData.footerAboutText}
                                            onChange={(e) => handleInputChange('footerAboutText', e.target.value)}
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-1.5 mt-4">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Footer Bottom Tagline
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.footerTagline}
                                            onChange={(e) => handleInputChange('footerTagline', e.target.value)}
                                            placeholder="Crafted with love for healthy living"
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-[#E8DEC8] space-y-4">
                                        <h3 className="text-xs font-bold text-[#3A2E1F]">Footer Feature Columns</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <input type="text" value={formData.footerFeature1Title} onChange={(e) => handleInputChange('footerFeature1Title', e.target.value)} placeholder="Feature 1 Title" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                                <input type="text" value={formData.footerFeature1Text} onChange={(e) => handleInputChange('footerFeature1Text', e.target.value)} placeholder="Feature 1 Subtext" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-[10px] text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <input type="text" value={formData.footerFeature2Title} onChange={(e) => handleInputChange('footerFeature2Title', e.target.value)} placeholder="Feature 2 Title" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                                <input type="text" value={formData.footerFeature2Text} onChange={(e) => handleInputChange('footerFeature2Text', e.target.value)} placeholder="Feature 2 Subtext" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-[10px] text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <input type="text" value={formData.footerFeature3Title} onChange={(e) => handleInputChange('footerFeature3Title', e.target.value)} placeholder="Feature 3 Title" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                                <input type="text" value={formData.footerFeature3Text} onChange={(e) => handleInputChange('footerFeature3Text', e.target.value)} placeholder="Feature 3 Subtext" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-3 py-2 text-[10px] text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Logo Upload Area */}
                                    <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Secondary Footer Logo (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            ref={footerLogoInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFooterLogoChange}
                                        />
                                        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl">
                                            <div className="w-20 h-20 rounded-2xl bg-white border border-[#E8DEC8] p-2 flex items-center justify-center shrink-0 shadow-xs">
                                                <img
                                                    src={formData.footerLogoPreview}
                                                    alt="Store Footer Logo Preview"
                                                    className="max-h-full max-w-full object-contain rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2 text-center sm:text-left flex-1">
                                                <h4 className="text-xs font-bold text-[#3A2E1F]">Alternative Footer Mark</h4>
                                                <p className="text-[11px] text-[#3A2E1F]/60">
                                                    Looks best with light or negative colored logos against the dark background.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => footerLogoInputRef.current?.click()}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-xs transition-all"
                                                >
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                    <span>Upload Footer Logo</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABOUT INFO */}
                        {activeTab === 'about' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <LayoutTemplate className="w-5 h-5 text-[#D97706]" /> About Us Layout
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Manage textual and image content for the About Us page.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block"> Hero Heading </label>
                                            <input type="text" value={formData.aboutHeroHeading} onChange={(e) => handleInputChange('aboutHeroHeading', e.target.value)} className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block"> Hero Subheading </label>
                                            <textarea rows={2} value={formData.aboutHeroSubheading} onChange={(e) => handleInputChange('aboutHeroSubheading', e.target.value)} className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block"> Story Heading </label>
                                            <input type="text" value={formData.aboutStoryHeading} onChange={(e) => handleInputChange('aboutStoryHeading', e.target.value)} className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block"> Story Text/Paragraph </label>
                                            <textarea rows={5} value={formData.aboutStoryText} onChange={(e) => handleInputChange('aboutStoryText', e.target.value)} className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                        </div>

                                        {/* About Image Upload */}
                                        <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                About Us Story Image
                                            </label>
                                            <input
                                                type="file"
                                                ref={aboutStoryImageRef}
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAboutStoryImageChange}
                                            />
                                            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl">
                                                <div className="w-24 h-24 rounded-2xl bg-white border border-[#E8DEC8] p-2 flex items-center justify-center shrink-0 shadow-xs">
                                                    <img
                                                        src={formData.aboutStoryImagePreview}
                                                        alt="About Story Image Preview"
                                                        className="max-h-full max-w-full object-cover rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2 text-center sm:text-left flex-1">
                                                    <h4 className="text-xs font-bold text-[#3A2E1F]">Story Feature Image</h4>
                                                    <p className="text-[11px] text-[#3A2E1F]/60">
                                                        High quality landscape image (4:3 ratio recommended)
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => aboutStoryImageRef.current?.click()}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-xs transition-all"
                                                    >
                                                        <UploadCloud className="w-3.5 h-3.5" />
                                                        <span>Upload Image</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRIVACY POLICY */}
                        {activeTab === 'privacy' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <LayoutTemplate className="w-5 h-5 text-[#D97706]" /> Privacy Policy HTML
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Privacy Content Editor Supports standard raw HTML editing
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block"> Raw HTML Source </label>
                                        <textarea rows={15} value={formData.privacyPolicyContent} onChange={(e) => handleInputChange('privacyPolicyContent', e.target.value)} className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs font-mono text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STORE SETTINGS */}
                        {activeTab === 'store' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-[#E8DEC8] pb-4">
                                    <h2 className="font-heading font-extrabold text-xl text-[#3A2E1F] flex items-center gap-2">
                                        <Sliders className="w-5 h-5 text-[#D97706]" /> Operational Store Defaults
                                    </h2>
                                    <p className="text-xs text-[#3A2E1F]/70 mt-1">
                                        Currency displays and shipping thresholds for cart calculations
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Currency Symbol
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.currencySymbol}
                                                onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                                                placeholder="e.g. Rs. "
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Currency ISO Code
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.currencyCode}
                                                onChange={(e) => handleInputChange('currencyCode', e.target.value)}
                                                placeholder="e.g. PKR"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Default Shipping Fee (Fixed)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.defaultShippingFee}
                                                onChange={(e) => handleInputChange('defaultShippingFee', e.target.value)}
                                                placeholder="e.g. 350"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Free Shipping Threshold
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.freeShippingThreshold}
                                                onChange={(e) => handleInputChange('freeShippingThreshold', e.target.value)}
                                                placeholder="e.g. 5000"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Order Prefix
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.orderPrefix}
                                                onChange={(e) => handleInputChange('orderPrefix', e.target.value)}
                                                placeholder="e.g. GB"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                SKU Prefix
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.skuPrefix}
                                                onChange={(e) => handleInputChange('skuPrefix', e.target.value)}
                                                placeholder="e.g. GBM"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Phone Validation Regex
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phonePattern}
                                                onChange={(e) => handleInputChange('phonePattern', e.target.value)}
                                                placeholder="^(\d{10,15})$"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-mono focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Phone Placeholder Mask
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phonePlaceholder}
                                                onChange={(e) => handleInputChange('phonePlaceholder', e.target.value)}
                                                placeholder="Phone Number"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                            Shipping Info Content (Product Detail)
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={formData.shippingInfoText}
                                            onChange={(e) => handleInputChange('shippingInfoText', e.target.value)}
                                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-[#E8DEC8]">
                                        <h3 className="text-sm font-bold text-[#3A2E1F]">Fallback Shipping Tab Content</h3>
                                        <p className="text-[10px] text-[#3A2E1F]/60">Used in the Product Detail page if the primary 'Shipping Info Content' is empty.</p>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Shipping Tab Heading</label>
                                            <input type="text" value={formData.shippingTabHeading} onChange={(e) => handleInputChange('shippingTabHeading', e.target.value)} placeholder="Nationwide Delivery" className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] font-bold focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#3A2E1F] uppercase tracking-wider block">Bullet 1</label>
                                                <input type="text" value={formData.shippingBullet1} onChange={(e) => handleInputChange('shippingBullet1', e.target.value)} placeholder="Orders dispatched within 24 hours." className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" /></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#3A2E1F] uppercase tracking-wider block">Bullet 2</label>
                                                <input type="text" value={formData.shippingBullet2} onChange={(e) => handleInputChange('shippingBullet2', e.target.value)} placeholder="Delivery time: 2–3 business days." className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" /></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#3A2E1F] uppercase tracking-wider block">Bullet 3 (Threshold varies)</label>
                                                <input type="text" value={formData.shippingBullet3} onChange={(e) => handleInputChange('shippingBullet3', e.target.value)} placeholder="Free shipping on all orders — no delivery charges." className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" /></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#3A2E1F] uppercase tracking-wider block">Bullet 4</label>
                                                <input type="text" value={formData.shippingBullet4} onChange={(e) => handleInputChange('shippingBullet4', e.target.value)} placeholder="Tracked delivery via courier service." className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" /></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Product Badge Text
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.productBadgeText}
                                                onChange={(e) => handleInputChange('productBadgeText', e.target.value)}
                                                placeholder="e.g. 100% Organic"
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                                Empty Cart Alert Text
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.emptyCartText}
                                                onChange={(e) => handleInputChange('emptyCartText', e.target.value)}
                                                placeholder="No products in cart..."
                                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>
            </div>

            {/* FLOATING ACTION BAR FOR MOBILE/REDUNDANCY */}
            <div className="fixed bottom-6 right-6 z-30 sm:hidden">
                <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#F5A623] text-[#3A2E1F] font-extrabold text-xs rounded-full shadow-2xl border border-[#3A2E1F]/20 active:scale-95 transition-all"
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Settings</span>
                </button>
            </div>

        </div>
    );
}
