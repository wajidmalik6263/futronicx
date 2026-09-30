'use client';

// Real site chrome for the SSR pages: mounts the ACTUAL Header and Footer
// components (client-side) around the server-rendered page content, so every
// page looks pixel-identical to the live site — same header, same rich footer
// (features bar, category/region/company columns, newsletter, social icons,
// bottom bar). Previously these pages used a simplified SiteChrome rewrite,
// which caused the design mismatch.
//
// Header/Footer use react-router <Link>/<NavLink>/useLocation + Settings/Cart/
// Wishlist contexts. We provide those here and bridge react-router navigations
// to real browser navigations (so links reach the Next SSR routes).
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SettingsProvider } from '../../context/SettingsContext';
import { CartProvider } from '../../context/CartContext';
import { WishlistProvider } from '../../context/WishlistContext';
import Header from '../Header';
import Footer from '../Footer';

// Turns any in-app react-router navigation (from a Header/Footer <Link>) into a
// real browser navigation so the target Next SSR route is served.
function NavBridge({ currentPath }) {
  const location = useLocation();
  useEffect(() => {
    const target = location.pathname + location.search + location.hash;
    if (target !== currentPath) {
      window.location.assign(target);
    }
  }, [location, currentPath]);
  return null;
}

export default function RealChrome({ isHome = false, children }) {
  // Header/Footer + BrowserRouter need `window`; render only on the client.
  // Before mount we still render the page content (children) so the server
  // HTML — including all crawlable content + metadata — is present for
  // crawlers; the header/footer chrome hydrates on top.
  const [mounted, setMounted] = useState(false);
  const [path, setPath] = useState('/');
  useEffect(() => {
    setMounted(true);
    setPath(window.location.pathname);
  }, []);

  const main = (
    <main
      className={
        isHome
          ? 'flex-grow pt-0 pb-20 md:pb-8 overflow-x-clip'
          : 'flex-grow pt-20 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 overflow-x-clip'
      }
    >
      {children}
    </main>
  );

  if (!mounted) {
    // Server / first paint: page content only (no client-only chrome yet).
    return (
      <div className="min-h-screen bg-[#FFFDF9] text-[#3A2E1F] font-body flex flex-col antialiased selection:bg-[#F5A623] selection:text-[#3A2E1F]">
        {main}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <HelmetProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen bg-[#FFFDF9] text-[#3A2E1F] font-body flex flex-col antialiased selection:bg-[#F5A623] selection:text-[#3A2E1F]">
                <Header />
                {main}
                <Footer />
              </div>
              <Routes>
                <Route path="*" element={<NavBridge currentPath={path} />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
