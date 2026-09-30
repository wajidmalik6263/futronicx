import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import RouteTransition from './components/RouteTransition';
import MobileCartBar from './components/MobileCartBar';
import { StorefrontSkeleton, AdminSkeleton, AdminLoginSkeleton, BlogDetailSkeleton, ProductDetailSkeleton, BlogListSkeleton, SimplePageSkeleton, TrackOrderSkeleton, AboutSkeleton, ContactSkeleton, CartSkeleton, CheckoutSkeleton, WishlistSkeleton } from './components/Skeletons';
import HomeSkeleton from './components/homepage/HomeSkeleton';

// Non-critical, always-mounted widgets. Deferred out of the initial storefront
// bundle so they never compete with above-the-fold content for the main thread.
const WhatsAppButton = React.lazy(() => import('./components/WhatsAppButton'));
const ChatBot = React.lazy(() => import('./components/ChatBot'));

// The Footer is always below the fold on first paint, yet it is a large
// component (inline brand SVGs + full link map) that also fires its own
// getCategories() request at mount. Rendering it eagerly makes both its parse/
// render and that network call compete with above-the-fold content, inflating
// Total Blocking Time. Split it into its own chunk and mount it after idle
// (see DeferredMount) so the storefront's first paint stays lean.
const Footer = React.lazy(() => import('./components/Footer'));

// Lazy-loaded Storefront Pages
const Home = React.lazy(() => import('./views/Home'));
const Products = React.lazy(() => import('./views/Product'));
const ProductDetail = React.lazy(() => import('./views/ProductDetail'));
const Cart = React.lazy(() => import('./views/Cart'));
const Wishlist = React.lazy(() => import('./views/Wishlist'));
const Checkout = React.lazy(() => import('./views/Checkout'));
const OrderConfirmation = React.lazy(() => import('./views/OrderConfirmation'));
const About = React.lazy(() => import('./views/About'));
const Contact = React.lazy(() => import('./views/Contact'));
const NotFound = React.lazy(() => import('./views/NotFound'));
const TrackOrder = React.lazy(() => import('./views/TrackOrder'));
const PrivacyPolicy = React.lazy(() => import('./views/PrivacyPolicy'));
const Blog = React.lazy(() => import('./views/Blog'));
const BlogDetail = React.lazy(() => import('./views/BlogDetail'));
const BlogSlugRouter = React.lazy(() => import('./views/BlogSlugRouter'));
const LocationPage = React.lazy(() => import('./views/LocationPage'));
const FaqPage = React.lazy(() => import('./views/FaqPage'));
const ShippingPage = React.lazy(() => import('./views/ShippingPage'));
const GuidesPage = React.lazy(() => import('./views/GuidesPage'));
const GuidelinesPage = React.lazy(() => import('./views/GuidelinesPage'));

// Lazy-loaded Admin Components & Pages
const AdminLogin = React.lazy(() => import('./views/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./views/admin/AdminDashboard'));
const AdminProducts = React.lazy(() => import('./views/admin/AdminProducts'));
const AdminOrders = React.lazy(() => import('./views/admin/AdminOrders'));
const AdminCategories = React.lazy(() => import('./views/admin/AdminCategories'));
const AdminSettings = React.lazy(() => import('./views/admin/AdminSettings'));
const AdminHomepage = React.lazy(() => import('./views/admin/AdminHomepage'));
const AdminPayments = React.lazy(() => import('./views/admin/AdminPayments'));
const AdminReviews = React.lazy(() => import('./views/admin/AdminReviews'));
const AdminBlogs = React.lazy(() => import('./views/admin/AdminBlogs'));

// Mounts its children only once the browser has gone idle after first paint.
// Used for always-present but non-critical widgets (chat, WhatsApp) so their
// lazy chunks are fetched + evaluated AFTER the page is interactive instead of
// competing with above-the-fold content — this trims Total Blocking Time.
function DeferredMount({ children }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const ric = typeof window !== 'undefined' && window.requestIdleCallback;
    const handle = ric
      ? window.requestIdleCallback(() => setReady(true), { timeout: 3000 })
      : setTimeout(() => setReady(true), 2000);
    return () => {
      if (ric && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, []);
  return ready ? children : null;
}

// Storefront Layout Component
function StorefrontLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3A2E1F] font-body flex flex-col antialiased selection:bg-[#F5A623] selection:text-[#3A2E1F]">
      <Header />
      <main className={`flex-grow ${isHome ? 'pt-0' : 'pt-20'} px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 overflow-x-clip`}>
        <Outlet />
      </main>
      {/* Footer is below the fold on first paint. Defer its mount so its parse,
          render and getCategories() call run after the page is interactive
          instead of competing with above-the-fold work. The wrapper reserves
          space so the deferred mount does not cause layout shift. */}
      <DeferredMount>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </DeferredMount>
      <MobileCartBar />
      <DeferredMount>
        <Suspense fallback={null}>
          <ChatBot />
          <WhatsAppButton />
        </Suspense>
      </DeferredMount>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <RouteTransition>
              <Routes>
                {/* Admin Login — uses a login-shaped fallback (not the dashboard
                    AdminSkeleton) so reloading /admin/login doesn't flash the
                    full dashboard shell before the login form loads. */}
                <Route path="/admin/login" element={<Suspense fallback={<AdminLoginSkeleton />}><AdminLogin /></Suspense>} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<Suspense fallback={<AdminSkeleton />}><ProtectedAdminRoute /></Suspense>}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Suspense fallback={<AdminSkeleton />}><AdminDashboard /></Suspense>} />
                    <Route path="homepage" element={<Suspense fallback={<AdminSkeleton />}><AdminHomepage /></Suspense>} />
                    <Route path="products" element={<Suspense fallback={<AdminSkeleton />}><AdminProducts /></Suspense>} />
                    <Route path="orders" element={<Suspense fallback={<AdminSkeleton />}><AdminOrders /></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<AdminSkeleton />}><AdminCategories /></Suspense>} />
                    <Route path="settings" element={<Suspense fallback={<AdminSkeleton />}><AdminSettings /></Suspense>} />
                    <Route path="payments" element={<Suspense fallback={<AdminSkeleton />}><AdminPayments /></Suspense>} />
                    <Route path="reviews" element={<Suspense fallback={<AdminSkeleton />}><AdminReviews /></Suspense>} />
                    <Route path="blogs" element={<Suspense fallback={<AdminSkeleton />}><AdminBlogs /></Suspense>} />
                  </Route>
                </Route>

                {/* Storefront Routes */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Suspense fallback={<HomeSkeleton />}><Home /></Suspense>} />
                  {/* Legacy alias: /shop (and sub-paths) now live under /products */}
                  <Route path="/shop" element={<Navigate to="/products" replace />} />
                  <Route path="/shop/:category" element={<Navigate to="/products" replace />} />
                  <Route path="/products" element={<Suspense fallback={<StorefrontSkeleton />}><Products /></Suspense>} />
                  <Route path="/products/:category" element={<Suspense fallback={<StorefrontSkeleton />}><Products /></Suspense>} />
                  <Route path="/product/:slug" element={<Suspense fallback={<ProductDetailSkeleton />}><ProductDetail /></Suspense>} />
                  <Route path="/cart" element={<Suspense fallback={<CartSkeleton />}><Cart /></Suspense>} />
                  <Route path="/wishlist" element={<Suspense fallback={<WishlistSkeleton />}><Wishlist /></Suspense>} />
                  <Route path="/checkout" element={<Suspense fallback={<CheckoutSkeleton />}><Checkout /></Suspense>} />
                  <Route path="/order-confirmation" element={<Suspense fallback={<SimplePageSkeleton />}><OrderConfirmation /></Suspense>} />
                  <Route path="/about" element={<Suspense fallback={<AboutSkeleton />}><About /></Suspense>} />
                  {/* Region landing pages (GEO/LLM SEO). One route per slug; the
                      page derives its slug from the pathname and pulls copy from
                      src/utils/locationSeo.js (mirrored server-side in prerender). */}
                  <Route path="/dry-fruits-pakistan" element={<Suspense fallback={<SimplePageSkeleton />}><LocationPage /></Suspense>} />
                  <Route path="/dry-fruits-gilgit-baltistan" element={<Suspense fallback={<SimplePageSkeleton />}><LocationPage /></Suspense>} />
                  <Route path="/dry-fruits-skardu" element={<Suspense fallback={<SimplePageSkeleton />}><LocationPage /></Suspense>} />
                  <Route path="/dry-fruits-hunza" element={<Suspense fallback={<SimplePageSkeleton />}><LocationPage /></Suspense>} />
                  <Route path="/dry-fruits-gilgit" element={<Suspense fallback={<SimplePageSkeleton />}><LocationPage /></Suspense>} />
                  {/* Informational pillar + support pages */}
                  <Route path="/faq" element={<Suspense fallback={<SimplePageSkeleton />}><FaqPage /></Suspense>} />
                  <Route path="/shipping" element={<Suspense fallback={<SimplePageSkeleton />}><ShippingPage /></Suspense>} />
                  <Route path="/guides" element={<Suspense fallback={<SimplePageSkeleton />}><GuidesPage /></Suspense>} />
                  <Route path="/guidelines" element={<Suspense fallback={<SimplePageSkeleton />}><GuidelinesPage /></Suspense>} />
                  <Route path="/contact" element={<Suspense fallback={<ContactSkeleton />}><Contact /></Suspense>} />
                  <Route path="/privacy" element={<Suspense fallback={<SimplePageSkeleton />}><PrivacyPolicy /></Suspense>} />
                  <Route path="/terms" element={<Navigate to="/privacy" replace />} />
                  {/* Blog listing (page 1) + paginated listing */}
                  <Route path="/blog" element={<Suspense fallback={<BlogListSkeleton />}><Blog /></Suspense>} />
                  <Route path="/blog/page/:page" element={<Suspense fallback={<BlogListSkeleton />}><Blog /></Suspense>} />
                  {/* Single dynamic segment: resolves to a category listing or an
                      article by consulting the categories API (see BlogSlugRouter). */}
                  <Route path="/blog/:slug" element={<Suspense fallback={<BlogDetailSkeleton />}><BlogSlugRouter /></Suspense>} />
                  <Route path="/blog/:slug/page/:page" element={<Suspense fallback={<BlogListSkeleton />}><Blog /></Suspense>} />
                  <Route path="/track-order" element={<Suspense fallback={<TrackOrderSkeleton />}><TrackOrder /></Suspense>} />
                  <Route path="*" element={<Suspense fallback={<SimplePageSkeleton />}><NotFound /></Suspense>} />
                </Route>
              </Routes>
            </RouteTransition>
          </SettingsProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
