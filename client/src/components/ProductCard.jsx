import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Check, Zap, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../hooks/useCurrency';
import { optimizeImage } from '../utils/imageUrl';

export default function ProductCard({ product }) {
    const { addItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [isAdded, setIsAdded] = useState(false);
    const wishlisted = isInWishlist(product?.id);

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    const {
        name,
        slug,
        category,
        category_name,
        category_slug,
        categorySlug,
        basePrice,
        base_price,
        rating,
        review_count,
        reviewsCount,
        images,
        image_url,
        isNew,
        is_featured,
        stock,
        stockStatus
    } = product || {};

    // Safely support both camelCase (dummy data) and snake_case (SQLite API)
    const price = base_price || basePrice || 0;
    const catName = category_name || category || 'Products';
    // Category slug for the internal link to the category listing page. Fall
    // back to slugifying the visible name if only a name is present.
    const catSlug = category_slug || categorySlug ||
        (typeof catName === 'string' && catName !== 'Products'
            ? catName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            : '');
    const displayRating = rating !== undefined && rating !== null ? Number(rating).toFixed(1) : '4.8';
    const displayReviews = review_count || reviewsCount || 25;
    const itemStock = stock !== undefined ? Number(stock) : (stockStatus === 'Out of Stock' ? 0 : 20);
    const isOutOfStock = itemStock <= 0 || stockStatus === 'Out of Stock';
    const isLowStock = !isOutOfStock && itemStock > 0 && itemStock < 5;

    // Image fallback logic
    const imageSrc = (images && images[0]) ? images[0] : (image_url || '/placeholder.png');

    // Parse weight options with fallbacks
    let parsedWeightOptions = [
        { label: '250g', price: price },
        { label: '500g', price: Math.round(price * 1.8) },
        { label: '1kg', price: Math.round(price * 3.4) }
    ];

    if (product?.weight_options) {
        try {
            const opts = typeof product.weight_options === 'string' ? JSON.parse(product.weight_options) : product.weight_options;
            if (Array.isArray(opts) && opts.length > 0) {
                parsedWeightOptions = opts;
            }
        } catch (e) {
            // fallback
        }
    } else if (product?.weightOptions && Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
        parsedWeightOptions = product.weightOptions;
    }

    const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
    const activeWeight = parsedWeightOptions[selectedWeightIndex] || parsedWeightOptions[0];
    const activePrice = activeWeight?.price || price;

    // Per-weight discount: use originalPrice if set and higher than sale price
    const activeOriginalPrice = activeWeight?.originalPrice && Number(activeWeight.originalPrice) > Number(activePrice)
        ? Number(activeWeight.originalPrice)
        : 0;
    const discountPercent = activeOriginalPrice > 0
        ? Math.round((1 - activePrice / activeOriginalPrice) * 100)
        : 0;

    // Quick Add to Cart (stay on page)
    const handleQuickAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock || isAdded) return;

        addItem(product, activeWeight, 1);
        setIsAdded(true);
        setTimeout(() => {
            setIsAdded(false);
        }, 1200);
    };

    // Buy Now Action (Add to cart & go directly to Checkout)
    const handleBuyNow = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock) return;

        addItem(product, activeWeight, 1);
        navigate('/checkout');
    };

    return (
        <div className="group bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full relative">
            {/* Top Image Container */}
            <div className="relative aspect-4/3 bg-[#F5EFE0] overflow-hidden">
                <Link to={`/product/${slug}`} className="block w-full h-full">
                    <img
                        src={optimizeImage(imageSrc, { width: 400, height: 300, crop: 'fill' })}
                        alt={name}
                        width="400"
                        height="300"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                </Link>

                {/* Badges - Top Left (Featured + Discount stacked) */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
                    {(isNew || is_featured === 1) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold bg-[#15803d] text-white rounded-full shadow-md">
                            <Star className="w-3 h-3 fill-white text-white" />
                            Featured
                        </span>
                    )}
                    {discountPercent > 0 && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold bg-rose-600 text-white rounded-full shadow-md">
                            {discountPercent}% OFF
                        </span>
                    )}
                </div>

                {/* Wishlist Heart - Top Right */}
                <button
                    type="button"
                    onClick={handleWishlistToggle}
                    aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
                    aria-pressed={wishlisted}
                    title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer ${wishlisted ? 'bg-rose-500 border border-rose-500' : 'bg-white/85 border border-white/60 hover:bg-white'}`}
                >
                    <Heart
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${wishlisted ? 'fill-white text-white' : 'text-[#3A2E1F] hover:text-rose-500'}`}
                    />
                </button>

                {/* Stock Badges - Top Right (below heart) */}
                <div className="absolute top-12 sm:top-14 right-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                    {isLowStock && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full border border-amber-300 shadow-xs">
                            Only {itemStock} left
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 rounded-full border border-rose-300 shadow-xs">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Category + Rating overlay - bottom of image */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 p-2 sm:p-2.5 min-h-[52px] bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none">
                    {catSlug ? (
                        <Link
                            to={`/products/${catSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Browse ${catName} products`}
                            className="pointer-events-auto inline-flex items-center min-h-[44px] py-1 px-2 max-w-[55%] text-[10px] sm:text-[11px] font-bold text-white drop-shadow hover:underline rounded"
                        >
                            <span className="truncate">{catName}</span>
                        </Link>
                    ) : (
                        <span className="truncate max-w-[55%] text-[10px] sm:text-[11px] font-bold text-white drop-shadow">{catName}</span>
                    )}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-sm">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#D97706] text-[#D97706]" />
                        <span className="font-extrabold text-[10px] sm:text-[11px] text-[#3A2E1F]">{displayRating}</span>
                        <span className="hidden sm:inline text-[10px] text-[#3A2E1F]/80 font-normal">({displayReviews})</span>
                    </div>
                </div>
            </div>

            {/* Card Body Details */}
            <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-1.5">
                    <Link to={`/product/${slug}`} className="block group-hover:text-[#D97706] transition-colors">
                        <h3 className="font-body font-extrabold text-[13px] sm:text-base text-[#1a1a2e] line-clamp-2 sm:line-clamp-1 leading-snug min-h-[2.4em] sm:min-h-0">
                            {name}
                        </h3>
                    </Link>

                    {/* WEIGHT VARIANTS SELECTION */}
                    {parsedWeightOptions.length > 0 && (
                        <div className="pt-0.5">
                            {/* Mobile: dropdown + action icons on one row */}
                            <div className="flex sm:hidden items-center gap-1.5">
                                <select
                                    value={selectedWeightIndex}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setSelectedWeightIndex(Number(e.target.value));
                                    }}
                                    aria-label="Select pack weight"
                                    className="flex-1 min-w-0 h-8 px-2 text-[11px] font-bold rounded-lg border border-[#E8DEC8] bg-[#F5EFE0]/60 text-[#3A2E1F] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                                >
                                    {parsedWeightOptions.map((opt, idx) => (
                                        <option key={idx} value={idx}>{opt.label}</option>
                                    ))}
                                </select>

                                {/* Add to Cart (aligned with dropdown) */}
                                <button
                                    type="button"
                                    onClick={handleQuickAdd}
                                    disabled={isOutOfStock}
                                    title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
                                    aria-label="Add to Cart"
                                    className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${isOutOfStock
                                        ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                        : isAdded
                                            ? 'text-emerald-600 border-emerald-300 bg-emerald-50'
                                            : 'text-[#3A2E1F] border-[#E8DEC8] bg-[#F5EFE0]/60'
                                        }`}
                                >
                                    {isAdded ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingCart className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Desktop: chips */}
                            <div className="hidden sm:block">
                                <span className="block text-[9px] sm:text-[10px] font-bold text-[#3A2E1F]/80 mb-1">Select Pack Weight:</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {parsedWeightOptions.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedWeightIndex(idx);
                                            }}
                                            className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all cursor-pointer border ${selectedWeightIndex === idx
                                                ? 'bg-[#F5A623] text-[#3A2E1F] border-[#D97706] shadow-2xs scale-105'
                                                : 'bg-[#F5EFE0]/60 hover:bg-[#F5EFE0] text-[#3A2E1F]/80 border-[#E8DEC8]'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Display & Direct Buy Action Bar */}
                <div className="flex items-end justify-between gap-2 pt-1.5 sm:pt-2 border-t border-[#E8DEC8]/70">
                    <div className="flex flex-col leading-tight min-w-0">
                        {activeOriginalPrice > 0 && (
                            <span className="text-[10px] sm:text-xs text-[#3A2E1F]/60 line-through">
                                {formatPrice(activeOriginalPrice)}
                            </span>
                        )}
                        <span className="text-base lg:text-lg font-extrabold font-body text-[#1a1a2e] truncate">
                            {formatPrice(activePrice)}
                        </span>
                    </div>

                    {/* Mobile: Buy Now aligned with price */}
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? 'Sold out' : 'Buy Now'}
                        aria-label={isOutOfStock ? 'Sold out' : `Buy ${name} now`}
                        className={`flex sm:hidden shrink-0 w-7 h-7 rounded-lg items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#F5A623] text-[#3A2E1F] shadow-sm'
                            }`}
                    >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Quick Add to Cart button */}
                        <button
                            type="button"
                            onClick={handleQuickAdd}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
                            aria-label="Add to Cart"
                            className={`
                                shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90
                                ${isOutOfStock
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : isAdded
                                        ? 'text-emerald-600 border-emerald-300 bg-emerald-50 scale-105'
                                        : 'text-[#3A2E1F] border-[#E8DEC8] bg-[#F5EFE0]/60 hover:bg-[#F5EFE0] hover:text-[#D97706] hover:border-[#D97706]'
                                }
                            `}
                        >
                            {isAdded ? (
                                <Check className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] stroke-[3]" />
                            ) : (
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
                            )}
                        </button>

                        {/* Direct Buy Now button (icon only) */}
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? 'Sold out' : 'Buy Now'}
                            aria-label={isOutOfStock ? 'Sold out' : `Buy ${name} now`}
                            className={`
                                shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90
                                ${isOutOfStock
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            <Zap className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] fill-current shrink-0" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
