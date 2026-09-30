'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App.jsx';
import { CartProvider } from '../../context/CartContext.jsx';
import { WishlistProvider } from '../../context/WishlistContext.jsx';

// react-hot-toast is only needed AFTER a user interaction (add to cart, etc.).
// Loading it eagerly pulls the toast runtime onto the initial-load critical
// path. Lazy-load it and mount inside Suspense so it never competes with
// above-the-fold content for the main thread. (Migrated from src/main.jsx.)
const Toaster = lazy(() =>
  import('react-hot-toast').then((m) => ({ default: m.Toaster }))
);

// The whole app is a react-router-dom SPA (BrowserRouter needs `window`), so
// this catch-all route renders everything on the client only. The [[...slug]]
// optional catch-all means EVERY path is served by this single client shell,
// and react-router handles the actual route matching exactly as before.
export default function CatchAllPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // SEO/GEO: the server ("light prerender") injects a static
    // <div id="seo-prerender"> with crawlable content for non-JS crawlers.
    // Now that the React app is booting, remove that static block so users
    // never see duplicated content. It lives OUTSIDE #root, so removing it
    // can't affect hydration. (Migrated from src/main.jsx.)
    const seoPrerender = document.getElementById('seo-prerender');
    if (seoPrerender) seoPrerender.remove();
  }, []);

  // Do not render the router during SSR / first paint — BrowserRouter and the
  // pages depend on browser APIs. This keeps the original SPA behaviour intact.
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
