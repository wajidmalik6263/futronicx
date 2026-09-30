// Server-rendered product card. The image, title, category, rating and badges
// are real HTML (visible with JS disabled). Interactive controls (weight,
// add-to-cart, buy, wishlist) are delegated to the ProductCardActions client
// island. Markup + Tailwind classes mirror the SPA ProductCard.
import Link from 'next/link';
import { Star } from 'lucide-react';
import { optimizeImage } from '../../utils/imageUrl';
import ProductCardActions from './ProductCardActions';

export default function ProductCardServer({ product, currencySymbol = '$' }) {
  const {
    name, slug, category, category_name, category_slug, categorySlug,
    rating, review_count, reviewsCount, image_url, images, isNew, is_featured,
    stock, stockStatus,
  } = product || {};

  const catName = category_name || category || 'Products';
  const catSlug =
    category_slug || categorySlug ||
    (typeof catName === 'string' && catName !== 'Products'
      ? catName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : '');
  const displayRating =
    rating !== undefined && rating !== null ? Number(rating).toFixed(1) : '4.8';
  const displayReviews = review_count || reviewsCount || 25;
  const itemStock = stock !== undefined ? Number(stock) : 20;
  const isOutOfStock = itemStock <= 0 || stockStatus === 'Out of Stock';
  const isLowStock = !isOutOfStock && itemStock > 0 && itemStock < 5;
  const imageSrc = (images && images[0]) ? images[0] : (image_url || '/placeholder.png');

  return (
    <div className="group bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full relative">
      <div className="relative aspect-4/3 bg-[#F5EFE0] overflow-hidden">
        <Link href={`/product/${slug}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizeImage(imageSrc, { width: 400, height: 300, crop: 'fill' })}
            alt={name}
            width="400"
            height="300"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        </Link>

        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
          {(isNew || is_featured === 1) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold bg-[#15803d] text-white rounded-full shadow-md">
              <Star className="w-3 h-3 fill-white text-white" />
              Featured
            </span>
          )}
        </div>

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

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 p-2 sm:p-2.5 min-h-[52px] bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none">
          {catSlug ? (
            <Link
              href={`/products/${catSlug}`}
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

      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-1.5">
          <Link href={`/product/${slug}`} className="block group-hover:text-[#D97706] transition-colors">
            <h3 className="font-body font-extrabold text-[13px] sm:text-base text-[#1a1a2e] line-clamp-2 sm:line-clamp-1 leading-snug min-h-[2.4em] sm:min-h-0">
              {name}
            </h3>
          </Link>
        </div>

        {/* Interactive controls (client island) */}
        <ProductCardActions product={product} currencySymbol={currencySymbol} />
      </div>
    </div>
  );
}
