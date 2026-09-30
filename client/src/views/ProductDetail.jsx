import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Star, ShoppingBag, Truck, ShieldCheck, RefreshCw, Plus, Minus,
    ChevronRight, AlertTriangle, Check, MapPin, Clock,
    MessageSquare, Loader2, Zap, ArrowLeft, ArrowRight
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProductBySlug, getProducts } from '../api/products';
import { getBlogs } from '../api/blogs';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../hooks/useCurrency';
import SEO from '../components/SEO';
import api from '../api/api';
import { optimizeImage } from '../utils/imageUrl';
import { LOCATION_SEO } from '../utils/locationSeo';

// Map a product's free-text `origin` to the region landing pages it matches,
// using the same originMatch terms the region pages use. Prefers the most
// specific regions (Skardu/Hunza/Gilgit) over the broad Pakistan page.
function regionLinksForOrigin(origin) {
    const o = String(origin || '').toLowerCase();
    if (!o) return [];
    const matches = [];
    for (const [slug, loc] of Object.entries(LOCATION_SEO)) {
        const terms = Array.isArray(loc.originMatch) ? loc.originMatch : [];
        if (terms.some((t) => o.includes(String(t).toLowerCase()))) {
            matches.push({ slug, region: loc.region });
        }
    }
    // Drop the national page when a more specific region already matched.
    if (matches.length > 1) {
        return matches.filter((m) => m.slug !== 'dry-fruits-pakistan');
    }
    return matches;
}

const StarRating = ({ value, onChange }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(s)}
                    className="transition-transform hover:scale-110 cursor-pointer">
                    <Star className={`w-6 h-6 transition-colors ${s <= (hovered || value) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E8DEC8] hover:text-[#F5A623]'}`} />
                </button>
            ))}
        </div>
    );
};

const StarDisplay = ({ rating, size = 'sm' }) => {
    const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`${sz} ${s <= Math.round(rating) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E8DEC8]'}`} />
            ))}
        </div>
    );
};
// Hand-tuned SEO title/description overrides keyed by product slug. When a
// product's slug matches, these take precedence over the auto-generated meta
// (product name / stripped description) so the meta matches the SEO sheet.
const PRODUCT_SEO_OVERRIDES = {
    'premium-kaghzi-akhroot-walnuts-natural-kaghzi-walnuts': {
        title: 'Premium Kaghzi Walnuts (Akhroot) | Buy Fresh Organic Nuts',
        description: 'Easy-to-crack, fresh, and nutrient-dense Kaghzi walnuts. Packed with healthy fats and rich flavor. Order premium Akhroot online now!',
    },
    'premium-shilajit-from-skardu-pure-mountain-shilajit': {
        title: 'Pure Mountain Shilajit from Skardu | 100% Natural Resin',
        description: 'Boost your energy and vitality with pure Skardu Shilajit. Lab-tested, mineral-rich, and 100% authentic mountain resin. Shop today!',
    },
    'premium-organic-sea-buckthorn-dried-berries-from-skardu-natural-berries': {
        title: 'Dried Sea Buckthorn Berries | Skardu Organic Superfood',
        description: 'Boost immunity with pure Skardu Sea Buckthorn berries. Packed with Vitamin C and essential antioxidants. Buy raw organic berries online!',
    },
    'pure-hand-picked-dried-mulberries-from-gilgit-natural-mulberries': {
        title: 'Pure Hand-Picked Dried Mulberries | Fresh Gilgit Fruits',
        description: 'Enjoy sweet, natural, hand-picked dried mulberries from Gilgit. 100% chemical-free and packed with nutrients. Order your healthy snack now!',
    },
    'premium-mountain-tea-tumburu-natural-himalayan-herbal-tea': {
        title: 'Tumburu Himalayan Herbal Tea | Organic Mountain Blend',
        description: 'Experience rich aroma and health benefits with Tumburu herbal mountain tea. Pure Himalayan herbs for wellness and digestion. Buy online!',
    },
    'premium-multilayer-apricot-khubani': {
        title: 'Premium Multilayer Apricots (Khubani) | Fresh & Dried',
        description: 'Indulge in naturally sweet, premium multilayer dried apricots. Packed with fiber and rich nutrients. Order organic Khubani online today!',
    },
    'pure-hand-picked-almonds-badam-from-hunza-premium-natural-almonds': {
        title: 'Organic Hunza Almonds (Badam) | Pure Hand-Picked Nuts',
        description: 'Crunchy, nutrient-dense Hunza almonds harvested naturally from the mountains. Packed with healthy oils and protein. Buy fresh Badam today!',
    },
    'normal-organic-walnuts-akhrot-natural-premium-walnuts': {
        title: 'Natural Organic Walnuts (Akhrot) | Fresh Himalayan Nuts',
        description: 'Crunchy, wholesome organic walnuts packed with brain-boosting Omega-3s. 100% natural and unrefined. Shop fresh Akhrot kernels & shells!',
    },
    'organic-shamdun-tea-from-skardu-premium-herbal-tea': {
        title: 'Organic Skardu Shamdun Herbal Tea | Pure Mountain Herbs',
        description: 'Unwind with authentic Shamdun herbal tea from Skardu. Naturally soothing, antioxidant-rich, and 100% organic tea blend. Order today!',
    },
    'authentic-skardu-apricots-khubani-premium-single-layer-dried-apricots': {
        title: 'Authentic Skardu Dried Apricots | Single Layer Khubani',
        description: 'Sun-dried, premium single layer apricots from Skardu. 100% naturally sweet and preservative-free. Shop healthy organic snacks now!',
    },
    'premium-organic-almond-kernels-badam-giri-north-dry-fruits': {
        title: 'Organic Almond Kernels (Badam Giri) | Fresh Mountain Nuts',
        description: 'Premium shelled almond kernels rich in Vitamin E and essential oils. Sweet, crisp, and 100% organic. Buy fresh Badam Giri online now!',
    },
    'premium-walnut-kernels-akhrot-giri-from-hunza-valley-natural-walnuts': {
        title: 'Hunza Walnut Kernels (Akhrot Giri) | Fresh Shell-Free',
        description: 'Raw, unsalted Hunza walnut kernels ready to eat. Packed with Omega-3 and brain nutrients. Order 100% pure, fresh Akhrot Giri today!',
    },
    'premium-apricot-khubnai-geri-natural-dried-apricot': {
        title: 'Fresh Apricot Kernels (Khubani Giri) | 100% Natural Nuts',
        description: 'Crunchy and nutritious natural apricot seed kernels (Khubani Giri). Great source of healthy fats and vitamins. Order online today!',
    },
    'khaghzi-almonds-khaghzi-badam-premium-fresh-almonds': {
        title: 'Soft-Shell Khaghzi Almonds (Badam) | Fresh Organic Nuts',
        description: 'Premium soft-shell Khaghzi almonds—easy to shell and rich in flavor! Packed with pure natural goodness and nutrients. Shop online now!',
    },
};

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [selectedImage, setSelectedImage] = useState('');
    const [allImages, setAllImages] = useState([]);
    const [selectedWeight, setSelectedWeight] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [isAdded, setIsAdded] = useState(false);

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, title: '', comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setNotFound(false);
            setReviewSubmitted(false);
            try {
                const data = await getProductBySlug(slug);
                setProduct(data);

                const imgs = [];
                if (data.image_url) imgs.push(data.image_url);
                if (data.gallery_images?.length > 0) imgs.push(...data.gallery_images);
                setAllImages(imgs);
                if (imgs.length > 0) setSelectedImage(imgs[0]);
                if (data.weight_options?.length > 0) setSelectedWeight(data.weight_options[0]);
                setQuantity(1);

                // Related products: start with the same category, then backfill
                // with other products so a PDP is never a dead-end (e.g. when a
                // category has only one product). De-duplicate by id.
                const sameCategory = (await getProducts({ category: data.category_slug }))
                    .filter(p => p.id !== data.id);
                let combined = [...sameCategory];
                if (combined.length < 4) {
                    try {
                        const fallback = (await getProducts({ limit: 12 }))
                            .filter(p => p.id !== data.id && !combined.some(c => c.id === p.id));
                        combined = [...combined, ...fallback];
                    } catch { /* keep same-category only */ }
                }
                setRelatedProducts(combined.slice(0, 4));
            } catch (error) {
                if (error.response?.status === 404) setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    useEffect(() => {
        if (activeTab === 'reviews' && product?.id) {
            setLoadingReviews(true);
            api.get(`/reviews?product_id=${product.id}`)
                .then(res => setReviews(res.data))
                .catch(() => { })
                .finally(() => setLoadingReviews(false));
        }
    }, [activeTab, product?.id]);

    // A few recent blog posts for the "Guides & Recipes" cross-link block —
    // connects the product to editorial content (internal linking).
    useEffect(() => {
        getBlogs({ limit: 4 })
            .then((res) => {
                const list = Array.isArray(res) ? res : (res?.data?.blogs || res?.blogs || []);
                setGuides(list.slice(0, 4));
            })
            .catch(() => { });
    }, []);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.rating) return;
        setSubmittingReview(true);
        try {
            await api.post('/reviews', {
                product_id: product.id,
                customer_name: reviewForm.name,
                customer_email: reviewForm.email || undefined,
                rating: reviewForm.rating,
                title: reviewForm.title || undefined,
                comment: reviewForm.comment || undefined,
            });
            setReviewSubmitted(true);
            setReviewForm({ name: '', email: '', rating: 0, title: '', comment: '' });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit review.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
                {/* Emit the canonical for this product route immediately (from the
                    URL slug) so it is present before the product data loads. This
                    prevents a previously-mounted page's canonical (e.g. the home
                    "/" canonical) from lingering and causing Lighthouse's
                    "Multiple conflicting URLs" warning. */}
                <SEO canonical={`/product/${slug}`} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    <div className="aspect-square bg-[#F5EFE0] rounded-2xl animate-pulse" />
                    <div className="space-y-5 py-4">
                        <div className="h-5 bg-[#F5EFE0] rounded w-24 animate-pulse" />
                        <div className="h-10 bg-[#F5EFE0] rounded w-3/4 animate-pulse" />
                        <div className="h-8 bg-[#F5EFE0] rounded w-1/3 animate-pulse" />
                        <div className="h-32 bg-[#F5EFE0] rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
                <SEO title="Product Not Found" description="The product you are looking for does not exist." noindex={true} />
                <AlertTriangle className="w-16 h-16 text-[#D97706] mx-auto opacity-50" />
                <h1 className="text-3xl font-body font-bold text-[#3A2E1F]">Product Not Found</h1>
                <p className="text-base text-[#3A2E1F]/60 font-body">The product you are looking for does not exist or has been removed.</p>
                <Link to="/products" className="inline-block px-8 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-bold rounded-full text-sm transition-colors font-body cursor-pointer">Return to Products</Link>
            </div>
        );
    }

    const itemStock = Number(product.stock ?? 20);
    const isOutOfStock = itemStock <= 0;
    const isLowStock = !isOutOfStock && itemStock < 5;
    const displayRating = product.rating ? Number(product.rating).toFixed(1) : '4.8';
    const displayReviews = product.review_count || 0;
    const currentPrice = selectedWeight ? selectedWeight.price * quantity : (product.base_price || 0) * quantity;
    const originalPrice = selectedWeight?.originalPrice && selectedWeight.originalPrice > selectedWeight.price
        ? selectedWeight.originalPrice * quantity
        : 0;
    const discountPercent = originalPrice > 0
        ? Math.round((1 - currentPrice / originalPrice) * 100)
        : 0;

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        addItem(product, selectedWeight, quantity);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1200);
    };

    const handleBuyNow = () => {
        if (isOutOfStock) return;
        addItem(product, selectedWeight, quantity);
        navigate('/checkout');
    };

    // ------------------------------------------------------------------
    // Structured-data helpers (kept in sync with server/routes/prerender.js).
    // ------------------------------------------------------------------
    const seoOrigin = (settings.site_url || window.location.origin).replace(/\/$/, '');
    const productUrl = `${seoOrigin}/product/${product.slug}`;
    const currencyCode = settings.currency_code || 'PKR';

    // Prefer the real, sellable prices from the weight options. Fall back to
    // base_price when a product has no variants. This avoids advertising a
    // base_price that doesn't match what the customer can actually buy.
    const optionPrices = (product.weight_options || [])
        .map(o => Number(o.price))
        .filter(n => Number.isFinite(n) && n > 0);
    const lowPrice = optionPrices.length ? Math.min(...optionPrices) : Number(product.base_price) || 0;
    const highPrice = optionPrices.length ? Math.max(...optionPrices) : Number(product.base_price) || 0;
    const availability = product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    // priceValidUntil ~1 year out (Google recommends the field on Offers).
    const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Shipping is always free on every order — no delivery charges.
    const shippingRate = 0;
    const shippingDetails = {
        "@type": "OfferShippingDetails",
        "shippingRate": {
            "@type": "MonetaryAmount",
            "value": shippingRate,
            "currency": currencyCode
        },
        "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": settings.country_code || "PK"
        },
        "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
            "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 3, "unitCode": "DAY" }
        }
    };
    const returnPolicy = {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": settings.country_code || "PK",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": Number(settings.return_window_days) || 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
    };

    // Build the Offer(s): AggregateOffer when there are multiple price points,
    // a single Offer otherwise.
    const commonOfferFields = {
        "priceCurrency": currencyCode,
        "availability": availability,
        "url": productUrl,
        "priceValidUntil": priceValidUntil,
        "shippingDetails": shippingDetails,
        "hasMerchantReturnPolicy": returnPolicy
    };
    const offers = (optionPrices.length > 1 && lowPrice !== highPrice)
        ? {
            "@type": "AggregateOffer",
            "offerCount": optionPrices.length,
            "lowPrice": lowPrice,
            "highPrice": highPrice,
            ...commonOfferFields
        }
        : {
            "@type": "Offer",
            "price": lowPrice,
            ...commonOfferFields
        };

    const productDescription = product.description
        ? product.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)
        : `Buy ${product.name} - ${settings.store_tagline || 'quality products at great prices.'}`;

    // Hand-tuned meta override for this product (by slug), if any.
    const seoOverride = PRODUCT_SEO_OVERRIDES[product.slug] || PRODUCT_SEO_OVERRIDES[slug];

    // additionalProperty exposes the per-product facts (origin, shelf life,
    // storage, available weights) as machine-readable key/values so LLMs and
    // rich results can extract them. Only include the ones that are set.
    const additionalProperty = [
        product.origin && { "@type": "PropertyValue", "name": "Origin", "value": product.origin },
        product.shelf_life && { "@type": "PropertyValue", "name": "Shelf Life", "value": product.shelf_life },
        product.storage_instructions && { "@type": "PropertyValue", "name": "Storage", "value": product.storage_instructions },
        product.weight_options?.length > 0 && {
            "@type": "PropertyValue",
            "name": "Available Weights",
            "value": product.weight_options.map(o => o.label).join(', ')
        },
    ].filter(Boolean);

    // brand + sku improve Product rich-result eligibility and merchant matching.
    // brand defaults to the store; sku is derived from the configured prefix
    // plus the product id (there is no dedicated per-product SKU column).
    const brandName = settings.store_name || 'North Dry Fruits';
    const productSku = product.id != null
        ? `${settings.sku_prefix || 'GBM'}${product.id}`
        : null;

    // ------------------------------------------------------------------
    // Per-product FAQ. Kept PRODUCT-SPECIFIC (origin, shelf life, storage,
    // sizes) so it doesn't duplicate the store-wide shipping/returns/payment
    // FAQ that lives on the Home page — large blocks of identical FAQ markup
    // across many URLs dilute FAQ rich-result eligibility. Rendered visibly AND
    // as FAQPage structured data. Mirrored in server/routes/prerender.js.
    // ------------------------------------------------------------------
    const faqs = [
        product.origin && {
            q: `Where does ${product.name} come from?`,
            a: `${product.name} is sourced from ${product.origin}.`,
        },
        product.shelf_life && {
            q: `What is the shelf life of ${product.name}?`,
            a: `${product.name} has a shelf life of ${product.shelf_life}.`,
        },
        product.storage_instructions && {
            q: `How should I store ${product.name}?`,
            a: `${product.storage_instructions}`,
        },
        product.weight_options?.length > 0 && {
            q: `What sizes is ${product.name} available in?`,
            a: `${product.name} is available in ${product.weight_options.map(o => o.label).join(', ')}.`,
        },
    ].filter(Boolean);

    const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
    };

    return (
        <div className="pb-28 md:pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
            <SEO
                {...(seoOverride
                    ? { rawTitle: seoOverride.title }
                    : { title: product.name })}
                description={seoOverride?.description || product.description?.replace(/<[^>]*>/g, '').substring(0, 160) || `Buy ${product.name} - ${settings.store_tagline || 'quality products at great prices.'}`}
                canonical={productUrl}
                ogImage={product.image_url}
                type="product"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "OnlineStore",
                            "@id": `${seoOrigin}/#organization`,
                            "name": brandName,
                            "url": `${seoOrigin}/`,
                            "logo": `${seoOrigin}/icons.svg`
                        },
                        {
                            "@type": "Product",
                            "name": product.name,
                            "description": productDescription,
                            "image": product.image_url || `${seoOrigin}/placeholder.png`,
                            "brand": { "@type": "Brand", "name": brandName },
                            ...(productSku ? { "sku": productSku } : {}),
                            ...(product.category_name ? { "category": product.category_name } : {}),
                            ...(additionalProperty.length ? { "additionalProperty": additionalProperty } : {}),
                            "offers": {
                                ...offers,
                                "seller": { "@id": `${seoOrigin}/#organization` }
                            },
                            ...(product.review_count > 0 ? {
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": product.rating,
                                    "reviewCount": product.review_count
                                }
                            } : {})
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": `${seoOrigin}/` },
                                { "@type": "ListItem", "position": 2, "name": "Products", "item": `${seoOrigin}/products` },
                                { "@type": "ListItem", "position": 3, "name": product.category_name, "item": `${seoOrigin}/products/${product.category_slug}` },
                                { "@type": "ListItem", "position": 4, "name": product.name, "item": productUrl }
                            ]
                        },
                        ...(faqs.length > 0 ? [faqSchema] : [])
                    ]
                }}
            />

            {/* BACK BUTTON */}
            <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1.5 text-sm text-[#B45309] hover:text-[#92400E] font-semibold transition-colors mb-4 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
            </button>

            {/* BREADCRUMB */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[#3A2E1F]/80 font-body mb-8 overflow-x-auto scrollbar-none">
                <Link to="/" className="hover:text-[#B45309] transition-colors cursor-pointer">Home</Link>
                <span aria-hidden="true">/</span>
                <Link to="/products" className="hover:text-[#B45309] transition-colors cursor-pointer">Products</Link>
                <span aria-hidden="true">/</span>
                <Link to={`/products/${product.category_slug}`} className="hover:text-[#B45309] transition-colors cursor-pointer">{product.category_name}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="text-[#3A2E1F] font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>

            {/* MAIN PRODUCT SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

                {/* IMAGE SECTION */}
                <div className="space-y-3">
                    <div className="aspect-square bg-white border border-[#E8DEC8] rounded-2xl overflow-hidden relative">
                        <img src={optimizeImage(selectedImage, { width: 800, height: 800, crop: 'fill' })} alt={product.name}
                            width="800" height="800"
                            fetchPriority="high" decoding="async"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                        {isOutOfStock && (
                            <span className="absolute top-4 right-4 px-3 py-1.5 bg-rose-500 text-white font-bold text-xs rounded-full font-body">Out of Stock</span>
                        )}
                        {isLowStock && !isOutOfStock && (
                            <span className="absolute top-4 right-4 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-full font-body">Only {itemStock} left</span>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
                            {allImages.map((img, idx) => (
                                <button key={idx} type="button" onClick={() => setSelectedImage(img)}
                                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === img ? 'border-[#F5A623] shadow-sm' : 'border-[#E8DEC8] hover:border-[#D97706]/50'}`}>
                                    <img src={optimizeImage(img, { width: 160, height: 160, crop: 'fill' })} alt={`View ${idx + 1}`}
                                        width="160" height="160" loading="lazy" decoding="async"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* PRODUCT INFO - Clean, no card wrapper */}
                <div className="space-y-6 py-2">
                    {/* Category */}
                    <Link to={`/products/${product.category_slug}`}
                        className="text-sm font-semibold text-[#B45309] hover:text-[#92400E] transition-colors font-body cursor-pointer">
                        {product.category_name}
                    </Link>

                    {/* Product Name */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] font-body leading-snug">
                        {product.name}
                    </h1>

                    {/* Price + Badge */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] font-body">
                            {formatPrice(currentPrice)}
                        </span>
                        {originalPrice > 0 && (
                            <span className="text-base text-[#3A2E1F]/40 line-through font-body">{formatPrice(originalPrice)}</span>
                        )}
                        {product.is_new === 1 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706] bg-[#F5EFE0] px-2.5 py-1 rounded-full border border-[#E8DEC8] font-body">
                                <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" /> Featured
                            </span>
                        )}
                    </div>

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-[#22c55e] bg-green-50 rounded-full border border-green-200 font-body">
                            {discountPercent}% OFF
                        </span>
                    )}

                    {/* Weight/Size Options */}
                    {product.weight_options?.length > 0 && (
                        <div className="space-y-2.5">
                            <label className="text-sm font-semibold text-[#3A2E1F] font-body">Size/Weight:</label>
                            <div className="flex flex-wrap gap-2.5">
                                {product.weight_options.map(option => (
                                    <button key={option.label} type="button" onClick={() => setSelectedWeight(option)}
                                        className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer ${selectedWeight?.label === option.label
                                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                                            : 'border-[#E8DEC8] bg-white hover:border-[#D97706]/50'}`}>
                                        <span className="block text-sm font-bold text-[#3A2E1F] font-body">{option.label}</span>
                                        <span className="block text-xs text-[#3A2E1F]/70 font-body mt-0.5">{formatPrice(option.price)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock Status */}
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        <span className={`text-sm font-semibold font-body ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                        </span>
                    </div>

                    {/* Short Description */}
                    {(product.short_description || product.description) && (
                        <p className="text-sm text-[#3A2E1F]/70 leading-relaxed font-body line-clamp-3">
                            {product.short_description || product.description?.replace(/<[^>]*>/g, '')}
                        </p>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-[#3A2E1F] font-body">Quantity:</label>
                        <div className="flex items-center border border-[#E8DEC8] rounded-lg overflow-hidden">
                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock}
                                aria-label="Decrease quantity"
                                className="w-10 h-10 flex items-center justify-center hover:bg-[#F5EFE0] disabled:opacity-40 transition-colors border-r border-[#E8DEC8] cursor-pointer">
                                <Minus className="w-4 h-4 text-[#3A2E1F]" aria-hidden="true" />
                            </button>
                            <span className="w-12 h-10 flex items-center justify-center text-base font-bold text-[#3A2E1F] font-body" aria-live="polite">{quantity}</span>
                            <button type="button" onClick={() => setQuantity(Math.min(itemStock, quantity + 1))} disabled={isOutOfStock || quantity >= itemStock}
                                aria-label="Increase quantity"
                                className="w-10 h-10 flex items-center justify-center hover:bg-[#F5EFE0] disabled:opacity-40 transition-colors border-l border-[#E8DEC8] cursor-pointer">
                                <Plus className="w-4 h-4 text-[#3A2E1F]" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button type="button" onClick={handleAddToCart} disabled={isOutOfStock}
                            className="flex-1 py-3.5 px-6 border-2 border-[#3A2E1F] text-[#3A2E1F] hover:bg-[#3A2E1F] hover:text-white disabled:opacity-40 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 min-h-[48px] font-body cursor-pointer">
                            {isAdded ? <><Check className="w-4 h-4 stroke-[3]" /><span>Added!</span></> : <><ShoppingBag className="w-4 h-4" /><span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span></>}
                        </button>
                        <button type="button" onClick={handleBuyNow} disabled={isOutOfStock}
                            className="flex-1 py-3.5 px-6 bg-[#F5A623] hover:bg-[#D97706] disabled:opacity-40 text-[#3A2E1F] hover:text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] font-body cursor-pointer">
                            <Zap className="w-4 h-4" />
                            <span>Buy Now</span>
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-between pt-5 border-t border-[#E8DEC8]">
                        <div className="flex items-center gap-2.5">
                            <Truck className="w-5 h-5 text-[#D97706]" />
                            <div>
                                <span className="block text-sm font-bold text-[#3A2E1F] font-body">Free Shipping</span>
                                <span className="block text-xs text-[#3A2E1F]/70 font-body">On all products</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-5 h-5 text-[#D97706]" />
                            <div>
                                <span className="block text-sm font-bold text-[#3A2E1F] font-body">Quality Assured</span>
                                <span className="block text-xs text-[#3A2E1F]/70 font-body">100% organic</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <RefreshCw className="w-5 h-5 text-[#D97706]" />
                            <div>
                                <span className="block text-sm font-bold text-[#3A2E1F] font-body">Easy Returns</span>
                                <span className="block text-xs text-[#3A2E1F]/70 font-body">7-day policy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS SECTION */}
            <div id="tabs-section" className="mt-14 border-t border-[#E8DEC8]">
                {/* Tab Headers - underline style */}
                <div className="flex items-center gap-6 border-b border-[#E8DEC8] overflow-x-auto scrollbar-none">
                    {[
                        { key: 'description', label: 'Description' },
                        { key: 'shipping', label: 'Shipping' },
                        { key: 'reviews', label: `Reviews (${displayReviews})` },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 font-body cursor-pointer ${activeTab === tab.key
                                ? 'border-[#B45309] text-[#B45309]'
                                : 'border-transparent text-[#3A2E1F]/70 hover:text-[#3A2E1F]'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="py-8">
                    {/* Description */}
                    {activeTab === 'description' && (
                        <div className="max-w-3xl space-y-5">
                            <h2 className="text-lg font-extrabold text-[#1a1a2e] font-body">Product Description</h2>
                            {product.description ? (
                                <div className="text-sm text-[#1a1a2e]/75 leading-relaxed font-body max-w-none overflow-x-hidden [overflow-wrap:break-word] [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-[#1a1a2e] [&_h1]:font-body [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-[#1a1a2e] [&_h2]:font-body [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#1a1a2e] [&_h3]:font-body [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-[#1a1a2e] [&_h4]:font-body [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:mb-3 [&_p]:text-[#1a1a2e]/75 [&_p]:font-body [&_strong]:font-bold [&_strong]:text-[#1a1a2e] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:text-[#1a1a2e]/75 [&_li]:font-body [&_a]:text-[#D97706] [&_a]:underline [&_a]:break-all [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:overflow-x-auto [&_pre]:overflow-x-auto [&_pre]:max-w-full"
                                    dangerouslySetInnerHTML={{ __html: product.description }} />
                            ) : (
                                <p className="text-sm text-[#3A2E1F]/75 leading-relaxed font-body">No description available.</p>
                            )}
                            {(product.origin || product.shelf_life) && (
                                <div className="space-y-2 pt-4">
                                    <h3 className="text-base font-bold text-[#1a1a2e] font-body">Product Details</h3>
                                    <ul className="space-y-1.5 text-sm text-[#3A2E1F]/70 font-body">
                                        {product.origin && (
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-2 shrink-0"></span>
                                                <span>
                                                    <strong className="text-[#3A2E1F]">Origin:</strong> {product.origin}
                                                    {regionLinksForOrigin(product.origin).length > 0 && (
                                                        <span className="block mt-1 text-xs">
                                                            Explore more:{' '}
                                                            {regionLinksForOrigin(product.origin).map((r, i, arr) => (
                                                                <React.Fragment key={r.slug}>
                                                                    <Link to={`/${r.slug}`} className="text-[#D97706] font-semibold hover:underline">
                                                                        Dry fruits from {r.region}
                                                                    </Link>
                                                                    {i < arr.length - 1 ? ', ' : ''}
                                                                </React.Fragment>
                                                            ))}
                                                        </span>
                                                    )}
                                                </span>
                                            </li>
                                        )}
                                        {product.shelf_life && (
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-2 shrink-0"></span>
                                                <span><strong className="text-[#3A2E1F]">Shelf Life:</strong> {product.shelf_life}</span>
                                            </li>
                                        )}
                                        {product.storage_instructions && (
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-2 shrink-0"></span>
                                                <span><strong className="text-[#3A2E1F]">Storage:</strong> {product.storage_instructions}</span>
                                            </li>
                                        )}
                                        {product.weight_options?.length > 0 && (
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-2 shrink-0"></span>
                                                <span><strong className="text-[#3A2E1F]">Weight:</strong> Available in {product.weight_options.map(o => o.label).join(', ')}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shipping */}
                    {activeTab === 'shipping' && (
                        <div className="max-w-3xl space-y-5">
                            <h2 className="text-lg font-extrabold text-[#1a1a2e] font-body">{settings.shipping_tab_heading || 'Nationwide Delivery'}</h2>
                            {settings.shipping_info_text ? (
                                <div className="whitespace-pre-wrap text-sm text-[#1a1a2e]/70 font-body leading-loose">{settings.shipping_info_text}</div>
                            ) : (
                                <div className="space-y-1.5 text-sm text-[#1a1a2e]/70 font-body leading-loose">
                                    <p>{settings.shipping_bullet_1 || 'Orders dispatched within 24 hours.'}
                                    </p>
                                    <p>{settings.shipping_bullet_2 || 'Delivery time: 2\u20133 business days.'}
                                    </p>
                                    <p>{settings.shipping_bullet_3 || 'Free shipping on all orders — no delivery charges.'}
                                    </p>
                                    <p>{settings.shipping_bullet_4 || 'Tracked delivery via courier service.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews */}
                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl space-y-8">
                            {/* Rating Summary */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold font-body text-[#3A2E1F]">{displayRating}</div>
                                    <StarDisplay rating={Number(displayRating)} size="md" />
                                    <div className="text-sm text-[#3A2E1F]/50 mt-1 font-body">{displayReviews} reviews</div>
                                </div>
                            </div>

                            {/* Review List */}
                            {loadingReviews ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-10 text-[#3A2E1F]/50 space-y-2">
                                    <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                                    <p className="text-base font-semibold font-body">No reviews yet</p>
                                    <p className="text-sm font-body">Be the first to share your experience!</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {reviews.map(r => (
                                        <div key={r.id} className="border-b border-[#E8DEC8] pb-5 space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="font-bold text-sm text-[#3A2E1F] font-body block">{r.customer_name}</span>
                                                    <StarDisplay rating={r.rating} />
                                                </div>
                                                <span className="text-xs text-[#3A2E1F]/40 shrink-0 font-body">
                                                    {new Date(r.created_at).toLocaleDateString(settings.locale?.replace('_', '-') || 'en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {r.title && <p className="text-sm font-bold text-[#3A2E1F] font-body">{r.title}</p>}
                                            {r.comment && <p className="text-sm text-[#3A2E1F]/70 leading-relaxed font-body">{r.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Review Form */}
                            <div className="border-t border-[#E8DEC8] pt-8 space-y-5">
                                <h2 className="text-lg font-extrabold text-[#1a1a2e] font-body">Write a Review</h2>
                                {reviewSubmitted ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                                        <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                                        <p className="font-bold text-base text-emerald-800 font-body">Thank you for your review!</p>
                                        <p className="text-sm text-emerald-700 font-body">Your review has been submitted and is pending approval.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitReview} className="space-y-5">
                                        <div>
                                            <label className="text-sm font-semibold text-[#3A2E1F] block mb-2 font-body">Your Rating *</label>
                                            <StarRating value={reviewForm.rating} onChange={v => setReviewForm(p => ({ ...p, rating: v }))} />
                                            {reviewForm.rating === 0 && <p className="text-xs text-rose-500 mt-1.5 font-body">Please select a rating</p>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-semibold text-[#3A2E1F] block mb-1.5 font-body">Your Name *</label>
                                                <input required type="text" value={reviewForm.name}
                                                    onChange={e => setReviewForm(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="e.g. Ahmed Khan"
                                                    className="w-full border border-[#E8DEC8] rounded-lg px-4 py-2.5 text-sm text-[#3A2E1F] font-body focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent placeholder:text-[#3A2E1F]/30 bg-white" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-[#3A2E1F] block mb-1.5 font-body">Email (optional)</label>
                                                <input type="email" value={reviewForm.email}
                                                    onChange={e => setReviewForm(p => ({ ...p, email: e.target.value }))}
                                                    placeholder="your@email.com"
                                                    className="w-full border border-[#E8DEC8] rounded-lg px-4 py-2.5 text-sm text-[#3A2E1F] font-body focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent placeholder:text-[#3A2E1F]/30 bg-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#3A2E1F] block mb-1.5 font-body">Review Title</label>
                                            <input type="text" value={reviewForm.title}
                                                onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                                                placeholder="e.g. Great quality product!"
                                                className="w-full border border-[#E8DEC8] rounded-lg px-4 py-2.5 text-sm text-[#3A2E1F] font-body focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent placeholder:text-[#3A2E1F]/30 bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#3A2E1F] block mb-1.5 font-body">Your Review</label>
                                            <textarea rows={4} value={reviewForm.comment}
                                                onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                                                placeholder="Share your experience with this product..."
                                                className="w-full border border-[#E8DEC8] rounded-lg px-4 py-2.5 text-sm text-[#3A2E1F] font-body focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent placeholder:text-[#3A2E1F]/30 bg-white resize-none" />
                                        </div>
                                        <button type="submit" disabled={submittingReview || !reviewForm.rating}
                                            className="flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-bold text-sm rounded-lg transition-all disabled:opacity-50 font-body cursor-pointer">
                                            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                            Submit Review
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FAQ SECTION — visible Q&A backing the FAQPage structured data.
                Gives shoppers quick answers and gives AI/search engines
                extractable, citable content. */}
            {faqs.length > 0 && (
                <section className="mt-14 border-t border-[#E8DEC8] pt-10 max-w-3xl">
                    <h2 className="text-xl font-extrabold text-[#1a1a2e] font-body mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <details key={i} className="group border border-[#E8DEC8] rounded-xl bg-[#FFFDF9] overflow-hidden">
                                <summary className="flex items-center justify-between gap-3 cursor-pointer px-4 py-3.5 text-sm font-bold text-[#3A2E1F] font-body list-none">
                                    <span>{f.q}</span>
                                    <Plus className="w-4 h-4 text-[#D97706] shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
                                </summary>
                                <div className="px-4 pb-4 text-sm text-[#3A2E1F]/75 leading-relaxed font-body">
                                    {f.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* GUIDES & RECIPES — cross-link the product into editorial content */}
            {guides.length > 0 && (
                <section className="mt-14 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-body text-[#3A2E1F]">Guides &amp; Recipes</h2>
                        <Link to="/blog" className="text-xs font-bold text-[#B45309] hover:text-[#92400E] hover:underline flex items-center gap-1 transition-colors">
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {guides.map((b) => (
                            <Link
                                key={b.id || b.slug}
                                to={`/blog/${b.slug}`}
                                className="group flex flex-col bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden hover:border-[#F5A623] hover:shadow-lg transition-all"
                            >
                                <div className="aspect-video overflow-hidden bg-[#F5EFE0]">
                                    <img
                                        src={optimizeImage(b.thumbnail || b.image || '/placeholder.png', { width: 400, height: 225, crop: 'fill' })}
                                        alt={b.title}
                                        width="400" height="225" loading="lazy" decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1 p-4">
                                    {(b.category || b.readTime) && (
                                        <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#8A5A00]">
                                            {b.category && (
                                                <span className="px-2 py-0.5 bg-[#F5A623]/10 rounded-full">{b.category}</span>
                                            )}
                                            {b.readTime && (
                                                <span className="flex items-center gap-1 text-[#3A2E1F]/50">
                                                    <Clock className="w-3 h-3" />
                                                    {b.readTime} min read
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <h3 className="text-sm font-bold font-body text-[#3A2E1F] group-hover:text-[#B45309] transition-colors line-clamp-2">{b.title}</h3>
                                    {(b.excerpt || b.summary) && (
                                        <p className="mt-1.5 text-xs leading-relaxed text-[#3A2E1F]/60 font-body line-clamp-3">
                                            {b.excerpt || b.summary}
                                        </p>
                                    )}
                                    <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-bold text-[#B45309] group-hover:text-[#92400E] transition-colors">
                                        Read Article
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* RELATED PRODUCTS */}
            {relatedProducts.length > 0 && (
                <div className="mt-14 space-y-6">
                    <h2 className="text-2xl font-bold font-body text-[#3A2E1F]">You Might Also Like</h2>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {relatedProducts.map(p => (
                            <ProductCard key={p.id} product={{ ...p, category: p.category_name || p.category_slug, images: [p.image_url], weightOptions: p.weight_options }} />
                        ))}
                    </div>
                </div>
            )}

            {/* STICKY MOBILE BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DEC8] p-3.5 shadow-2xl flex items-center justify-between gap-3 md:hidden">
                <div>
                    <span className="text-xs text-[#3A2E1F]/50 block font-body">{selectedWeight?.label || '500g'}</span>
                    <span className="text-lg font-bold font-body text-[#3A2E1F]">
                        {formatPrice(currentPrice)}
                    </span>
                </div>
                <button type="button" onClick={handleAddToCart} disabled={isOutOfStock}
                    className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 min-h-[44px] font-body cursor-pointer ${isOutOfStock ? 'bg-gray-200 text-gray-400' : isAdded ? 'bg-emerald-600 text-white' : 'bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F]'}`}>
                    {isAdded ? <><Check className="w-4 h-4 stroke-[3]" /><span>Added!</span></> : <><ShoppingBag className="w-4 h-4" /><span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span></>}
                </button>
            </div>
        </div>
    );
}
