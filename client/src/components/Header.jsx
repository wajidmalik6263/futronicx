import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { optimizeImage } from '../utils/imageUrl';

export default function Header() {
    const { settings, loading: settingsLoading } = useSettings();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { cartItems } = useCart();
    const { wishlist } = useWishlist();
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const wishlistCount = wishlist.length;
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            // Batch the layout read (window.scrollY) into a rAF so it doesn't
            // interleave with style writes on every scroll event (which caused
            // the forced-reflow / scroll-time main-thread blocking). Only call
            // setState when the boolean actually changes to avoid re-renders.
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const next = window.scrollY > 50;
                setScrolled(prev => (prev === next ? prev : next));
                ticking = false;
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'Guides', path: '/guides' },
        { name: 'Blog', path: '/blog' },
        { name: 'Track Order', path: '/track-order' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    // On home page: transparent at top, solid on scroll. On other pages: always solid.
   const headerBg = 'bg-white border-b border-gray-200 shadow-md';

    // Skeleton header while settings are loading
    if (settingsLoading) {
        return (
           <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo skeleton — width matches the loaded logo box (w-40) to avoid layout shift */}
                        <div className="h-10 w-40 rounded-md bg-white/8 animate-pulse" />

                        {/* Nav links skeleton (Desktop) */}
                        <div className="hidden md:flex items-center gap-5">
                            <div className="h-3.5 w-12 rounded-sm bg-white/8 animate-pulse" />
                            <div className="h-3.5 w-16 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.1s' }} />
                            <div className="h-3.5 w-10 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="h-3.5 w-20 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.3s' }} />
                            <div className="h-3.5 w-12 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            <div className="h-3.5 w-14 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Right icons skeleton (Desktop) */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Wishlist icon */}
                            <div className="w-5 h-5 rounded-full bg-white/8 animate-pulse" />
                            {/* Cart icon */}
                            <div className="w-5 h-5 rounded-full bg-white/8 animate-pulse" style={{ animationDelay: '0.15s' }} />
                            {/* Login button */}
                            <div className="h-8 w-[72px] rounded bg-white/8 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>

                        {/* Mobile icons skeleton */}
                        <div className="flex md:hidden items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/8 animate-pulse" />
                            <div className="w-6 h-6 rounded bg-white/8 animate-pulse" style={{ animationDelay: '0.15s' }} />
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo — fixed-size box prevents layout shift while the logo loads */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center cursor-pointer h-10 w-40" aria-label={`${settings.store_name || 'North Dry Fruits'} — Home`}>
                            <img
                                src={settings.logo_url && !settings.logo_url.includes('placeholder') ? optimizeImage(settings.logo_url, { width: 160, height: 40, dpr: 1.5 }) : '/logo.svg'}
                                alt={settings.store_name || 'North Dry Fruits'}
                                width="160"
                                height="40"
                                fetchPriority="high"
                                className="h-10 w-full object-contain object-left"
                            />
                        </Link>
                    </div>

                    {/* Nav Links Center (Desktop) */}
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors py-1 cursor-pointer ${isActive
                                        ? 'text-[#F5A623] font-semibold'
                                        : 'text-[#525252] hover:text-[#F5A623]'
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Right Section: Wishlist, Cart, Login */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Wishlist */}
                        <Link
                            to="/wishlist"
                            className="relative p-2 text-white/80 hover:text-[#F5A623] transition-colors cursor-pointer"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart */}
                        <Link
                            to="/cart"
                            className="relative p-2 text-white/80 hover:text-[#F5A623] transition-colors cursor-pointer"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>


                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-3">
                        <Link
                            to="/wishlist"
                            className="relative p-2 text-white cursor-pointer"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            to="/cart"
                            className="relative p-2 text-white cursor-pointer"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#2A2116] text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            type="button"
                            className="p-2 text-white hover:text-[#F5A623] cursor-pointer"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#2A2116] border-t border-[#3d3320] px-4 pt-3 pb-6 space-y-3">
                    <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) =>
                                    `px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-[#3d3320] text-[#F5A623] font-semibold' : 'text-white/90 hover:bg-[#3d3320] hover:text-white'}`
                                }
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                </div>
            )}
        </header>
    );
}