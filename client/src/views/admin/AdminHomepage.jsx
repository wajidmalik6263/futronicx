import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutTemplate, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
    Save, RefreshCw, Image as ImageIcon, GripVertical, Sparkles,
    ShoppingBag, Grid3x3, Layers, ImagePlus, Megaphone, Star,
    X, UploadCloud, ChevronRight, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import {
    getHomepageSectionsAdmin,
    createHomepageSection,
    updateHomepageSection,
    reorderHomepageSections,
    deleteHomepageSection
} from '../../api/homepage';
import { getCategories } from '../../api/categories';
import { Modal } from '../../components/admin/AdminComponents';

const SECTION_TYPES = [
    { type: 'hero_banner', label: 'Hero Banner', icon: Sparkles, description: 'Full-width carousel with slides' },
    { type: 'product_carousel', label: 'Product Carousel', icon: ShoppingBag, description: 'Horizontal scrolling product strip' },
    { type: 'product_grid', label: 'Product Grid', icon: Grid3x3, description: 'Grid layout of product cards' },
    { type: 'category_showcase', label: 'Category Showcase', icon: Layers, description: 'Scrolling category marquee' },
    { type: 'banner_image', label: 'Banner Image', icon: ImagePlus, description: 'Promotional image banner' },
    { type: 'promo_cards', label: 'Promo Cards', icon: Megaphone, description: 'Promotional offer cards' },
    { type: 'reviews', label: 'Customer Reviews', icon: Star, description: 'Testimonials & reviews' },
    { type: 'blog_posts', label: 'Blog Posts', icon: BookOpen, description: 'Recent blog articles' },
];

const DEFAULT_CONFIGS = {
    hero_banner: { slides: [{ badge: '', title: 'New Banner', subtitle: '', ctaText: 'Shop Now', ctaLink: '/products', image: '', highlight: '' }] },
    product_carousel: { heading: 'New Products', badge: '', description: '', filter: 'new', maxItems: 8, categorySlug: '' },
    product_grid: { heading: 'Products', badge: '', filter: 'featured', maxItems: 6, categorySlug: '' },
    category_showcase: { heading: 'Browse Categories', description: '' },
    banner_image: { image: '', link: '', alt: '' },
    promo_cards: { cards: [{ badge: '', heading: 'Offer Title', body: '', ctaText: 'Shop Now', ctaLink: '/products', theme: 'dark' }] },
    reviews: { heading: 'Customer Reviews', reviews: [{ name: '', rating: 5, text: '', location: '' }] },
    blog_posts: { heading: 'Latest from Our Blog', maxItems: 3 },
};

export default function AdminHomepage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // section id being saved
    const [expandedId, setExpandedId] = useState(null);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [categories, setCategories] = useState([]);
    const imageInputRef = useRef(null);
    const [pendingImageCallback, setPendingImageCallback] = useState(null);

    useEffect(() => {
        fetchSections();
        getCategories().then(setCategories).catch(() => { });
    }, []);

    const fetchSections = async () => {
        try {
            const data = await getHomepageSectionsAdmin();
            setSections(data);
        } catch (err) {
            toast.error('Failed to load homepage sections');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSection = async (type) => {
        setShowTypePicker(false);
        try {
            const typeInfo = SECTION_TYPES.find(t => t.type === type);
            const newSection = await createHomepageSection({
                section_type: type,
                title: typeInfo?.label || type,
                config: DEFAULT_CONFIGS[type] || {}
            });
            setSections(prev => [...prev, newSection]);
            setExpandedId(newSection.id);
            toast.success(`${typeInfo?.label} section added!`);
        } catch (err) {
            toast.error('Failed to add section');
        }
    };

    const handleSaveSection = async (id) => {
        setSaving(id);
        try {
            const section = sections.find(s => s.id === id);
            await updateHomepageSection(id, {
                title: section.title,
                config: section.config,
                is_visible: section.is_visible
            });
            toast.success('Section saved!');
        } catch (err) {
            toast.error('Failed to save section');
        } finally {
            setSaving(null);
        }
    };

    const handleToggleVisibility = async (id) => {
        const section = sections.find(s => s.id === id);
        const newVisible = section.is_visible ? 0 : 1;
        setSections(prev => prev.map(s => s.id === id ? { ...s, is_visible: newVisible } : s));
        try {
            await updateHomepageSection(id, { is_visible: !!newVisible });
        } catch (err) {
            toast.error('Toggle failed');
            setSections(prev => prev.map(s => s.id === id ? { ...s, is_visible: section.is_visible } : s));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this section permanently?')) return;
        try {
            await deleteHomepageSection(id);
            setSections(prev => prev.filter(s => s.id !== id));
            if (expandedId === id) setExpandedId(null);
            toast.success('Section deleted');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleMove = async (id, direction) => {
        const idx = sections.findIndex(s => s.id === id);
        if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sections.length - 1)) return;

        const newSections = [...sections];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
        setSections(newSections);

        try {
            await reorderHomepageSections(newSections.map(s => s.id));
        } catch (err) {
            toast.error('Reorder failed');
            fetchSections();
        }
    };

    const updateSectionConfig = (id, configUpdate) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            return { ...s, config: { ...s.config, ...configUpdate } };
        }));
    };

    const updateSectionTitle = (id, title) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    };

    const handleImageUpload = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post('/upload', fd);
        return data.url;
    };

    const triggerImageUpload = (callback) => {
        setPendingImageCallback(() => callback);
        imageInputRef.current?.click();
    };

    const onImageInputChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !pendingImageCallback) return;
        try {
            const url = await handleImageUpload(file);
            pendingImageCallback(url);
            toast.success('Image uploaded!');
        } catch (err) {
            toast.error('Image upload failed');
        }
        e.target.value = '';
        setPendingImageCallback(null);
    };

    const getTypeIcon = (type) => {
        const info = SECTION_TYPES.find(t => t.type === type);
        return info ? info.icon : LayoutTemplate;
    };

    const getTypeLabel = (type) => {
        const info = SECTION_TYPES.find(t => t.type === type);
        return info ? info.label : type;
    };

    // ============== Section Config Editors ==============

    const renderConfigEditor = (section) => {
        switch (section.section_type) {
            case 'hero_banner': return renderHeroBannerEditor(section);
            case 'product_carousel': return renderProductFilterEditor(section, true);
            case 'product_grid': return renderProductFilterEditor(section, false);
            case 'category_showcase': return renderSimpleTextEditor(section);
            case 'banner_image': return renderBannerImageEditor(section);
            case 'promo_cards': return renderPromoCardsEditor(section);
            case 'reviews': return renderReviewsEditor(section);
            case 'blog_posts': return renderBlogPostsEditor(section);
            default: return <p className="text-xs text-[#3A2E1F]/60">No editor available for this section type.</p>;
        }
    };

    const renderHeroBannerEditor = (section) => {
        const slides = section.config?.slides || [];
        return (
            <div className="space-y-4">
                {slides.map((slide, idx) => (
                    <div key={idx} className="bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3A2E1F]">Slide {idx + 1}</span>
                            {slides.length > 1 && (
                                <button type="button" onClick={() => {
                                    const newSlides = slides.filter((_, i) => i !== idx);
                                    updateSectionConfig(section.id, { slides: newSlides });
                                }} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField label="Badge" value={slide.badge} onChange={v => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], badge: v };
                                updateSectionConfig(section.id, { slides: ns });
                            }} />
                            <InputField label="Highlight" value={slide.highlight} onChange={v => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], highlight: v };
                                updateSectionConfig(section.id, { slides: ns });
                            }} />
                        </div>
                        <InputField label="Title" value={slide.title} onChange={v => {
                            const ns = [...slides]; ns[idx] = { ...ns[idx], title: v };
                            updateSectionConfig(section.id, { slides: ns });
                        }} />
                        <TextAreaField label="Subtitle" value={slide.subtitle} onChange={v => {
                            const ns = [...slides]; ns[idx] = { ...ns[idx], subtitle: v };
                            updateSectionConfig(section.id, { slides: ns });
                        }} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField label="CTA Text" value={slide.ctaText} onChange={v => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], ctaText: v };
                                updateSectionConfig(section.id, { slides: ns });
                            }} />
                            <InputField label="CTA Link" value={slide.ctaLink} onChange={v => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], ctaLink: v };
                                updateSectionConfig(section.id, { slides: ns });
                            }} />
                        </div>
                        <ImageUploadField
                            label="Slide Image"
                            value={slide.image}
                            onUpload={(url) => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], image: url };
                                updateSectionConfig(section.id, { slides: ns });
                            }}
                            onUrlChange={(v) => {
                                const ns = [...slides]; ns[idx] = { ...ns[idx], image: v };
                                updateSectionConfig(section.id, { slides: ns });
                            }}
                            triggerUpload={triggerImageUpload}
                        />
                    </div>
                ))}
                {slides.length < 5 && (
                    <button type="button" onClick={() => {
                        updateSectionConfig(section.id, {
                            slides: [...slides, { badge: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/products', image: '', highlight: '' }]
                        });
                    }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] text-xs font-bold rounded-full border border-[#E8DEC8] transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Slide
                    </button>
                )}
            </div>
        );
    };

    const renderProductFilterEditor = (section, isCarousel) => {
        const config = section.config || {};
        return (
            <div className="space-y-4">
                <InputField label="Heading" value={config.heading} onChange={v => updateSectionConfig(section.id, { heading: v })} />
                <InputField label="Badge Text" value={config.badge} onChange={v => updateSectionConfig(section.id, { badge: v })} />
                {isCarousel && (
                    <TextAreaField label="Description" value={config.description} onChange={v => updateSectionConfig(section.id, { description: v })} />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Filter</label>
                        <select
                            value={config.filter || 'all'}
                            onChange={e => updateSectionConfig(section.id, { filter: e.target.value })}
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                        >
                            <option value="all">All Products</option>
                            <option value="featured">Featured Only</option>
                            <option value="new">Newest First</option>
                            <option value="category">By Category</option>
                        </select>
                    </div>
                    {config.filter === 'category' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Category</label>
                            <select
                                value={config.categorySlug || ''}
                                onChange={e => updateSectionConfig(section.id, { categorySlug: e.target.value })}
                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Max Items</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={config.maxItems || 6}
                            onChange={e => updateSectionConfig(section.id, { maxItems: Number(e.target.value) })}
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderSimpleTextEditor = (section) => {
        const config = section.config || {};
        return (
            <div className="space-y-4">
                <InputField label="Heading" value={config.heading} onChange={v => updateSectionConfig(section.id, { heading: v })} />
                <TextAreaField label="Description" value={config.description} onChange={v => updateSectionConfig(section.id, { description: v })} />
            </div>
        );
    };

    const renderBlogPostsEditor = (section) => {
        const config = section.config || {};
        return (
            <div className="space-y-4">
                <InputField label="Heading" value={config.heading} onChange={v => updateSectionConfig(section.id, { heading: v })} />
                <InputField label="Max Items" value={config.maxItems?.toString() || '3'} onChange={v => updateSectionConfig(section.id, { maxItems: parseInt(v) || 3 })} />
            </div>
        );
    };

    const renderBannerImageEditor = (section) => {
        const config = section.config || {};
        return (
            <div className="space-y-4">
                <ImageUploadField
                    label="Banner Image"
                    value={config.image}
                    onUpload={(url) => updateSectionConfig(section.id, { image: url })}
                    onUrlChange={(v) => updateSectionConfig(section.id, { image: v })}
                    triggerUpload={triggerImageUpload}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Link URL" value={config.link} onChange={v => updateSectionConfig(section.id, { link: v })} placeholder="/products or https://..." />
                    <InputField label="Alt Text" value={config.alt} onChange={v => updateSectionConfig(section.id, { alt: v })} placeholder="Descriptive text for SEO" />
                </div>
            </div>
        );
    };

    const renderPromoCardsEditor = (section) => {
        const cards = section.config?.cards || [];
        return (
            <div className="space-y-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3A2E1F]">Card {idx + 1}</span>
                            <div className="flex items-center gap-2">
                                <select
                                    value={card.theme || 'dark'}
                                    onChange={e => {
                                        const nc = [...cards]; nc[idx] = { ...nc[idx], theme: e.target.value };
                                        updateSectionConfig(section.id, { cards: nc });
                                    }}
                                    className="bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-lg px-2 py-1 text-[10px] text-[#3A2E1F]"
                                >
                                    <option value="dark">Dark Theme</option>
                                    <option value="light">Light Theme</option>
                                </select>
                                {cards.length > 1 && (
                                    <button type="button" onClick={() => {
                                        updateSectionConfig(section.id, { cards: cards.filter((_, i) => i !== idx) });
                                    }} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <InputField label="Badge" value={card.badge} onChange={v => {
                            const nc = [...cards]; nc[idx] = { ...nc[idx], badge: v };
                            updateSectionConfig(section.id, { cards: nc });
                        }} />
                        <InputField label="Heading" value={card.heading} onChange={v => {
                            const nc = [...cards]; nc[idx] = { ...nc[idx], heading: v };
                            updateSectionConfig(section.id, { cards: nc });
                        }} />
                        <TextAreaField label="Body" value={card.body} onChange={v => {
                            const nc = [...cards]; nc[idx] = { ...nc[idx], body: v };
                            updateSectionConfig(section.id, { cards: nc });
                        }} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField label="CTA Text" value={card.ctaText} onChange={v => {
                                const nc = [...cards]; nc[idx] = { ...nc[idx], ctaText: v };
                                updateSectionConfig(section.id, { cards: nc });
                            }} />
                            <InputField label="CTA Link" value={card.ctaLink} onChange={v => {
                                const nc = [...cards]; nc[idx] = { ...nc[idx], ctaLink: v };
                                updateSectionConfig(section.id, { cards: nc });
                            }} />
                        </div>
                    </div>
                ))}
                {cards.length < 2 && (
                    <button type="button" onClick={() => {
                        updateSectionConfig(section.id, {
                            cards: [...cards, { badge: '', heading: '', body: '', ctaText: 'Shop Now', ctaLink: '/products', theme: 'light' }]
                        });
                    }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] text-xs font-bold rounded-full border border-[#E8DEC8] transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Card
                    </button>
                )}
            </div>
        );
    };

    const renderReviewsEditor = (section) => {
        const config = section.config || {};
        const reviews = config.reviews || [];
        return (
            <div className="space-y-4">
                <InputField label="Section Heading" value={config.heading} onChange={v => updateSectionConfig(section.id, { heading: v })} />
                {reviews.map((review, idx) => (
                    <div key={idx} className="bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3A2E1F]">Review {idx + 1}</span>
                            {reviews.length > 1 && (
                                <button type="button" onClick={() => {
                                    updateSectionConfig(section.id, { reviews: reviews.filter((_, i) => i !== idx) });
                                }} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <InputField label="Name" value={review.name} onChange={v => {
                                const nr = [...reviews]; nr[idx] = { ...nr[idx], name: v };
                                updateSectionConfig(section.id, { reviews: nr });
                            }} />
                            <InputField label="Location" value={review.location} onChange={v => {
                                const nr = [...reviews]; nr[idx] = { ...nr[idx], location: v };
                                updateSectionConfig(section.id, { reviews: nr });
                            }} />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Rating</label>
                                <select
                                    value={review.rating || 5}
                                    onChange={e => {
                                        const nr = [...reviews]; nr[idx] = { ...nr[idx], rating: Number(e.target.value) };
                                        updateSectionConfig(section.id, { reviews: nr });
                                    }}
                                    className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                >
                                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                </select>
                            </div>
                        </div>
                        <TextAreaField label="Review Text" value={review.text} onChange={v => {
                            const nr = [...reviews]; nr[idx] = { ...nr[idx], text: v };
                            updateSectionConfig(section.id, { reviews: nr });
                        }} />
                    </div>
                ))}
                <button type="button" onClick={() => {
                    updateSectionConfig(section.id, {
                        reviews: [...reviews, { name: '', rating: 5, text: '', location: '' }]
                    });
                }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] text-xs font-bold rounded-full border border-[#E8DEC8] transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Review
                </button>
            </div>
        );
    };

    // ============== RENDER ==============

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#D97706]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
            {/* Hidden file input for image uploads */}
            <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={onImageInputChange} />

            {/* Header */}
            <div className="sticky top-[65px] md:top-[73px] z-20 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E8DEC8] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#3A2E1F] flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-[#D97706]" />
                        <span>Homepage CMS</span>
                    </h1>
                    <p className="text-[11px] text-[#3A2E1F]/70 hidden sm:block">
                        Add, remove, reorder & configure homepage sections dynamically
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowTypePicker(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-extrabold text-xs rounded-full shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Section</span>
                </button>
            </div>

            {/* Section List */}
            {sections.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <LayoutTemplate className="w-16 h-16 text-[#E8DEC8] mx-auto" />
                    <p className="text-sm text-[#3A2E1F]/60">No homepage sections yet. Click "Add Section" to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, idx) => {
                        const TypeIcon = getTypeIcon(section.section_type);
                        const isExpanded = expandedId === section.id;
                        return (
                            <div key={section.id} className={`bg-[#FFFDF9] border rounded-2xl shadow-xs transition-all ${isExpanded ? 'border-[#F5A623] shadow-md' : 'border-[#E8DEC8]'}`}>
                                {/* Section Header */}
                                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : section.id)}>
                                    <GripVertical className="w-4 h-4 text-[#E8DEC8] shrink-0" />
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.is_visible ? 'bg-[#F5A623]/20 text-[#D97706]' : 'bg-[#E8DEC8]/50 text-[#3A2E1F]/40'}`}>
                                        <TypeIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-sm truncate ${section.is_visible ? 'text-[#3A2E1F]' : 'text-[#3A2E1F]/40 line-through'}`}>
                                                {section.title || getTypeLabel(section.section_type)}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#D97706]/60 uppercase tracking-wider shrink-0">
                                                {getTypeLabel(section.section_type)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button type="button" onClick={() => handleMove(section.id, 'up')} disabled={idx === 0} className="w-7 h-7 rounded-lg bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] flex items-center justify-center transition-all disabled:opacity-30" aria-label="Move up">
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleMove(section.id, 'down')} disabled={idx === sections.length - 1} className="w-7 h-7 rounded-lg bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] flex items-center justify-center transition-all disabled:opacity-30" aria-label="Move down">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleToggleVisibility(section.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${section.is_visible ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-400 hover:bg-red-100'}`} aria-label={section.is_visible ? 'Hide section' : 'Show section'}>
                                            {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={() => handleDelete(section.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all" aria-label="Delete section">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-[#E8DEC8] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>

                                {/* Section Body (Expanded) */}
                                {isExpanded && (
                                    <div className="px-4 pb-5 pt-1 border-t border-[#E8DEC8]/50 space-y-4">
                                        <InputField label="Section Title" value={section.title} onChange={v => updateSectionTitle(section.id, v)} />
                                        {renderConfigEditor(section)}
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveSection(section.id)}
                                                disabled={saving === section.id}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-extrabold text-xs rounded-full shadow-md transition-all disabled:opacity-50"
                                            >
                                                {saving === section.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                <span>{saving === section.id ? 'Saving...' : 'Save Section'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Type Picker Modal */}
            <Modal
                isOpen={showTypePicker}
                onClose={() => setShowTypePicker(false)}
                title="Add New Section"
            >
                <div className="space-y-2">
                    {SECTION_TYPES.map(st => {
                        const Icon = st.icon;
                        return (
                            <button
                                key={st.type}
                                type="button"
                                onClick={() => handleAddSection(st.type)}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#F5EFE0]/50 hover:bg-[#F5A623]/20 border border-[#E8DEC8] hover:border-[#F5A623] text-left transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 group-hover:bg-[#F5A623] text-[#D97706] group-hover:text-[#3A2E1F] flex items-center justify-center transition-all">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#3A2E1F]">{st.label}</div>
                                    <div className="text-[11px] text-[#3A2E1F]/60">{st.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}

// ============== Shared Form Components ==============

function InputField({ label, value, onChange, placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">{label}</label>
            <input
                type="text"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || ''}
                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
        </div>
    );
}

function TextAreaField({ label, value, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">{label}</label>
            <textarea
                rows={3}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
        </div>
    );
}

function ImageUploadField({ label, value, onUpload, onUrlChange, triggerUpload }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">{label}</label>
            <div className="flex flex-col sm:flex-row items-start gap-3">
                {value && (
                    <div className="w-24 h-16 rounded-xl bg-[#F5EFE0] border border-[#E8DEC8] overflow-hidden shrink-0">
                        <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                    </div>
                )}
                <div className="flex-1 w-full space-y-2">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={e => onUrlChange(e.target.value)}
                        placeholder="Image URL or upload..."
                        className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                    <button
                        type="button"
                        onClick={() => triggerUpload(onUpload)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-xs transition-all"
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
