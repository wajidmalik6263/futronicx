import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';

export default function Wishlist() {
    const { wishlist, clearWishlist } = useWishlist();
    const { settings } = useSettings();
    const storeName = settings?.store_name || 'North Dry Fruits';

    return (
        <div className="max-w-[1400px] mx-auto pb-16">
            <SEO
                title={`My Wishlist - ${storeName}`}
                description="Your saved products and favorites."
                canonical={`${window.location.origin}/wishlist`}
            />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
                        <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                        My Wishlist
                    </h1>
                    <p className="text-sm text-[#3A2E1F]/70 mt-1">
                        {wishlist.length > 0
                            ? `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved`
                            : 'You have not saved any products yet.'}
                    </p>
                </div>

                {wishlist.length > 0 && (
                    <button
                        type="button"
                        onClick={clearWishlist}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </button>
                )}
            </div>

            {/* Content */}
            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl">
                    <div className="w-20 h-20 rounded-full bg-[#F5EFE0] flex items-center justify-center mb-5">
                        <Heart className="w-9 h-9 text-[#D97706]" />
                    </div>
                    <h2 className="font-heading text-xl font-extrabold text-[#1a1a2e] mb-2">Your wishlist is empty</h2>
                    <p className="text-sm text-[#3A2E1F]/70 max-w-md mb-6">
                        Tap the heart on any product to save it here for later.
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-extrabold text-sm bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        Browse Products
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {wishlist.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
