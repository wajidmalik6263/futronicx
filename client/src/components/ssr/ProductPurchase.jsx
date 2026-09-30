'use client';

// Client island for the product-detail page: image thumbnails, weight select,
// quantity stepper, add-to-cart and buy-now. The product's core info (name,
// price, description, main image) is server-rendered; this hydrates the
// interactive purchase controls. Cart writes use the same store_cart shape as
// CartContext and dispatch a 'storage' event for the header badge island.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ShoppingBag, Check, Zap } from 'lucide-react';
import { optimizeImage } from '../../utils/imageUrl';
import { formatPrice } from '../../lib/format';

function addToCart(product, weight, quantity) {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('store_cart') || '[]');
  } catch { cart = []; }
  const label = weight?.label || 'Standard';
  const price = weight?.price || product.base_price || 0;
  const idx = cart.findIndex(
    (it) => it.product_id === product.id && it.weight_option === label
  );
  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      slug: product.slug,
      product_name: product.name,
      image: product.image_url,
      weight_option: label,
      price,
      quantity,
    });
  }
  localStorage.setItem('store_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('storage'));
}

export default function ProductPurchase({ product, currencySymbol = '$' }) {
  const router = useRouter();

  const images = [];
  if (product.image_url) images.push(product.image_url);
  if (Array.isArray(product.gallery_images)) images.push(...product.gallery_images);

  const weightOptions =
    Array.isArray(product.weight_options) && product.weight_options.length > 0
      ? product.weight_options
      : [];

  const [selectedImage, setSelectedImage] = useState(images[0] || '/placeholder.png');
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const itemStock = Number(product.stock ?? 20);
  const isOutOfStock = itemStock <= 0;

  const unit = selectedWeight ? selectedWeight.price : product.base_price || 0;
  const currentPrice = unit * quantity;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedWeight, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };
  const handleBuy = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedWeight, quantity);
    router.push('/checkout');
  };

  return (
    <div className="space-y-5">
      {/* Main image + thumbnails (interactive gallery) */}
      <div className="aspect-square bg-white border border-[#E8DEC8] rounded-2xl overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizeImage(selectedImage, { width: 800, height: 800, crop: 'fill' })}
          alt={product.name}
          width="800"
          height="800"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === img ? 'border-[#F5A623] shadow-sm' : 'border-[#E8DEC8] hover:border-[#D97706]/50'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizeImage(img, { width: 160, height: 160, crop: 'fill' })}
                alt={`View ${idx + 1}`}
                width="160"
                height="160"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Live price */}
      <div className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] font-body">
        {formatPrice(currentPrice, currencySymbol)}
      </div>

      {/* Weight options */}
      {weightOptions.length > 0 && (
        <div className="space-y-2">
          <span className="block text-xs font-bold text-[#3A2E1F]/80">Select Pack Weight:</span>
          <div className="flex flex-wrap gap-2">
            {weightOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedWeight(opt)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all cursor-pointer ${selectedWeight?.label === opt.label ? 'bg-[#F5A623] text-[#3A2E1F] border-[#D97706]' : 'bg-[#F5EFE0]/60 text-[#3A2E1F]/80 border-[#E8DEC8] hover:bg-[#F5EFE0]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-[#3A2E1F]/80">Quantity:</span>
        <div className="flex items-center border border-[#E8DEC8] rounded-lg overflow-hidden">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2 hover:bg-[#F5EFE0] cursor-pointer" aria-label="Decrease quantity">
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-4 text-sm font-bold">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => q + 1)} className="p-2 hover:bg-[#F5EFE0] cursor-pointer" aria-label="Increase quantity">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all cursor-pointer ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isAdded ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-[#F5A623] text-[#3A2E1F] hover:bg-[#F5A623]'}`}
        >
          {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          <span>{isOutOfStock ? 'Out of Stock' : isAdded ? 'Added!' : 'Add to Cart'}</span>
        </button>
        <button
          type="button"
          onClick={handleBuy}
          disabled={isOutOfStock}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all cursor-pointer ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white'}`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
}
