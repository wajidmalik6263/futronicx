'use client';

// Small client island for the SSR header. The server renders the header chrome
// (logo, nav, icons) as real HTML; this island only hydrates the live cart /
// wishlist badge counts, read straight from localStorage (the same keys the
// CartContext/WishlistContext persist to). No provider or router needed, so it
// stays tiny and does not drag the SPA stack into the server-rendered routes.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';

function readCount(key, reducer) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return reducer(Array.isArray(parsed) ? parsed : []);
  } catch {
    return 0;
  }
}

export default function HeaderCartIsland({ variant = 'desktop' }) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      setCartCount(
        readCount('store_cart', (items) =>
          items.reduce((acc, it) => acc + (it.quantity || 0), 0)
        )
      );
      setWishlistCount(readCount('store_wishlist', (items) => items.length));
    };
    sync();
    // Keep in sync if another tab (or the SPA) mutates storage.
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const iconColor = variant === 'mobile' ? 'text-white' : 'text-white/80 hover:text-[#F5A623]';

  return (
    <>
      <Link href="/wishlist" className={`relative p-2 ${iconColor} transition-colors cursor-pointer`} aria-label="Wishlist">
        <Heart className="w-5 h-5" />
        {wishlistCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
            {wishlistCount}
          </span>
        )}
      </Link>
      <Link href="/cart" className={`relative p-2 ${iconColor} transition-colors cursor-pointer`} aria-label="Shopping Cart">
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>
    </>
  );
}
