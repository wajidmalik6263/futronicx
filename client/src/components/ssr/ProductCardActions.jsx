'use client';

// Client actions island for the server-rendered product card. The product's
// visible info (image, name, price, rating, category) is server HTML; this
// island hydrates only the interactive controls: weight select, add-to-cart,
// buy-now, wishlist. It reads/writes the SAME localStorage keys and item shapes
// as CartContext (store_cart) and WishlistContext (store_wishlist) so state is
// shared with the rest of the SPA, and dispatches a 'storage' event so the
// header badge island updates immediately.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Check, Zap, Heart } from 'lucide-react';
import { formatPrice } from '../../lib/format';

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  // Notify same-tab listeners (the header island listens for 'storage').
  window.dispatchEvent(new Event('storage'));
}

export default function ProductCardActions({ product, currencySymbol = '$' }) {
  const router = useRouter();
  const price = product.base_price || product.basePrice || 0;

  const weightOptions = useMemo(() => {
    if (product.weight_options) {
      try {
        const opts =
          typeof product.weight_options === 'string'
            ? JSON.parse(product.weight_options)
            : product.weight_options;
        if (Array.isArray(opts) && opts.length > 0) return opts;
      } catch { /* fall through */ }
    }
    if (Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
      return product.weightOptions;
    }
    return [
      { label: '250g', price },
      { label: '500g', price: Math.round(price * 1.8) },
      { label: '1kg', price: Math.round(price * 3.4) },
    ];
  }, [product, price]);

  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(() =>
    readJSON('store_wishlist').some((i) => i.id === product.id)
  );

  const activeWeight = weightOptions[selectedWeightIndex] || weightOptions[0];
  const activePrice = activeWeight?.price || price;

  const itemStock = product.stock !== undefined ? Number(product.stock) : 20;
  const isOutOfStock = itemStock <= 0 || product.stockStatus === 'Out of Stock';

  const addToCart = () => {
    const cart = readJSON('store_cart');
    const label = activeWeight?.label || 'Standard';
    const idx = cart.findIndex(
      (it) => it.product_id === product.id && it.weight_option === label
    );
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        slug: product.slug,
        product_name: product.name,
        image: product.images?.[0] || product.image_url,
        weight_option: label,
        price: activePrice,
        quantity: 1,
      });
    }
    writeJSON('store_cart', cart);
  };

  const handleQuickAdd = () => {
    if (isOutOfStock || isAdded) return;
    addToCart();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart();
    router.push('/checkout');
  };

  const handleWishlistToggle = () => {
    const list = readJSON('store_wishlist');
    const exists = list.some((i) => i.id === product.id);
    if (exists) {
      writeJSON('store_wishlist', list.filter((i) => i.id !== product.id));
      setWishlisted(false);
    } else {
      list.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        base_price: price,
        image_url: product.images?.[0] || product.image_url || '/placeholder.png',
        category_name: product.category_name || product.category || 'Products',
        rating: product.rating,
        review_count: product.review_count ?? product.reviewsCount,
        weight_options: product.weight_options || product.weightOptions,
        stock: product.stock,
        stockStatus: product.stockStatus,
      });
      writeJSON('store_wishlist', list);
      setWishlisted(true);
    }
  };

  return (
    <>
      {/* Wishlist heart — absolutely positioned over the server-rendered image */}
      <button
        type="button"
        onClick={handleWishlistToggle}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wishlisted}
        className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer ${wishlisted ? 'bg-rose-500 border border-rose-500' : 'bg-white/85 border border-white/60 hover:bg-white'}`}
      >
        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${wishlisted ? 'fill-white text-white' : 'text-[#3A2E1F] hover:text-rose-500'}`} />
      </button>

      {/* Weight select + price + action buttons row */}
      <div className="pt-0.5">
        <span className="block text-[9px] sm:text-[10px] font-bold text-[#3A2E1F]/80 mb-1">Select Pack Weight:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {weightOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedWeightIndex(idx)}
              className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all cursor-pointer border ${selectedWeightIndex === idx
                ? 'bg-[#F5A623] text-[#3A2E1F] border-[#D97706] shadow-2xs scale-105'
                : 'bg-[#F5EFE0]/60 hover:bg-[#F5EFE0] text-[#3A2E1F]/80 border-[#E8DEC8]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 pt-1.5 sm:pt-2 border-t border-[#E8DEC8]/70 mt-2">
        <span className="text-base lg:text-lg font-extrabold font-body text-[#1a1a2e] truncate">
          {formatPrice(activePrice, currencySymbol)}
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            aria-label="Add to Cart"
            className={`shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${isOutOfStock ? 'text-gray-400 border-gray-200 cursor-not-allowed' : isAdded ? 'text-emerald-600 border-emerald-300 bg-emerald-50 scale-105' : 'text-[#3A2E1F] border-[#E8DEC8] bg-[#F5EFE0]/60 hover:bg-[#F5EFE0] hover:text-[#D97706] hover:border-[#D97706]'}`}
          >
            {isAdded ? <Check className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] stroke-[3]" /> : <ShoppingCart className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Sold out' : 'Buy Now'}
            aria-label={isOutOfStock ? 'Sold out' : `Buy ${product.name} now`}
            className={`shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white shadow-sm hover:shadow-md'}`}
          >
            <Zap className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] fill-current shrink-0" />
          </button>
        </div>
      </div>
    </>
  );
}
