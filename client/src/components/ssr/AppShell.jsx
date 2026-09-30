'use client';

// Renders the full original SPA (App.jsx with BrowserRouter + all providers).
// Used by the dedicated SEO routes (product, blog, category, about, contact,
// etc.) so the VISIBLE DESIGN on every page is the exact original view
// component — pixel-identical to the live site — while the route's server page
// still emits per-page metadata + JSON-LD for Google indexing.
//
// react-router matches the current browser URL and renders the correct real
// view (ProductDetail, About, Blog, …) with the real Header/Footer, exactly as
// the SPA always did. BrowserRouter needs `window`, so we render only on the
// client (after mount); the server HTML for the route carries the SEO content.
import { useEffect, useState, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App.jsx';
import { CartProvider } from '../../context/CartContext.jsx';
import { WishlistProvider } from '../../context/WishlistContext.jsx';

const Toaster = lazy(() =>
  import('react-hot-toast').then((m) => ({ default: m.Toaster }))
);

export default function AppShell() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seoPrerender = document.getElementById('seo-prerender');
    if (seoPrerender) seoPrerender.remove();
  }, []);

  if (!mounted) return null;

  return (
    <HelmetProvider>
      <CartProvider>
        <WishlistProvider>
          <Suspense fallback={null}>
            <Toaster position="top-center" />
          </Suspense>
          <App />
        </WishlistProvider>
      </CartProvider>
    </HelmetProvider>
  );
}
