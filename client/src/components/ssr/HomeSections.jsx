'use client';

// Full interactive homepage — renders the EXACT same section components the
// live SPA uses (hero slider, category showcase, product carousel/grid, promo
// cards, reviews, blog), driven by the /homepage sections API. This makes the
// Next home page pixel-identical to https://northdryfruits.com/.
//
// Router bridge: the section components use react-router <Link>/<useNavigate>.
// We mount them inside a BrowserRouter so those APIs work unchanged, plus a
// catch-all <NavBridge> route that turns any in-app react-router navigation
// into a REAL browser navigation (window.location) — so clicking a product /
// category / blog link loads the corresponding Next SSR route instead of
// dead-ending inside react-router (which no longer owns those paths).
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SettingsProvider } from '../../context/SettingsContext';
import { CartProvider } from '../../context/CartContext';
import { WishlistProvider } from '../../context/WishlistContext';
import { getHomepageSections } from '../../api/homepage';

import HeroBanner from '../homepage/HeroBanner';
import HomeSkeleton from '../homepage/HomeSkeleton';

const ProductCarousel = React.lazy(() => import('../homepage/ProductCarousel'));
const ProductGrid = React.lazy(() => import('../homepage/ProductGrid'));
const CategoryShowcase = React.lazy(() => import('../homepage/CategoryShowcase'));
const PromoCards = React.lazy(() => import('../homepage/PromoCards'));
const ReviewsSection = React.lazy(() => import('../homepage/ReviewsSection'));
const BlogSection = React.lazy(() => import('../homepage/BlogSection'));
const BannerImage = React.lazy(() => import('../homepage/BannerImage'));

const SECTION_COMPONENTS = {
  hero_banner: HeroBanner,
  product_carousel: ProductCarousel,
  product_grid: ProductGrid,
  category_showcase: CategoryShowcase,
  banner_image: BannerImage,
  promo_cards: PromoCards,
  reviews: ReviewsSection,
  blog_posts: BlogSection,
};

// Rendered by the catch-all route. Whenever react-router navigates to a path
// (from a section <Link> or useNavigate), do a real browser navigation so the
// Next SSR route for that path is served. The home path "/" is excluded so the
// homepage itself doesn't reload.
function NavBridge() {
  const location = useLocation();
  useEffect(() => {
    const target = location.pathname + location.search + location.hash;
    if (location.pathname !== '/') {
      window.location.assign(target);
    }
  }, [location]);
  return null;
}

function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomepageSections()
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="space-y-10 sm:space-y-16 pb-6 sm:pb-16">
      {sections
        .filter((s) => (s.config?.heading || '').trim().toLowerCase() !== 'most sales products')
        .map((section, index) => {
          const Component = SECTION_COMPONENTS[section.section_type];
          if (!Component) return null;
          if (index === 0) {
            return (
              <Suspense key={section.id} fallback={<HomeSkeleton />}>
                <Component config={section.config} />
              </Suspense>
            );
          }
          return (
            <div key={section.id} className="cv-auto">
              <Suspense fallback={<div className="min-h-[400px]" />}>
                <Component config={section.config} />
              </Suspense>
            </div>
          );
        })}

      {/* Blog section — always visible on the landing page (matches the SPA). */}
      <div className="cv-auto">
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <BlogSection config={{ heading: 'Latest from Our Blog', maxItems: 4 }} />
        </Suspense>
      </div>
    </div>
  );
}

export default function HomeSections() {
  // BrowserRouter (react-router) needs `window`, so render only on the client.
  // During SSR we output the HomeSkeleton (which reserves the correct height,
  // preventing layout shift), then the full interactive homepage mounts after
  // hydration. The crawlable SEO content lives in the server page (app/page.jsx)
  // outside this island, so indexing is unaffected.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <HomeSkeleton />;

  return (
    <BrowserRouter>
      <HelmetProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                <Route path="/" element={<Sections />} />
                <Route path="*" element={<NavBridge />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
