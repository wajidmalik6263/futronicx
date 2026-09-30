import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from '../utils/toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// Normalizes a product (camelCase dummy data or snake_case API) into the
// minimal shape the wishlist page / product card need.
const normalizeProduct = (product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    base_price: product.base_price ?? product.basePrice ?? 0,
    image_url: product.images?.[0] || product.image_url || '/placeholder.png',
    category_name: product.category_name || product.category || 'Products',
    rating: product.rating,
    review_count: product.review_count ?? product.reviewsCount,
    weight_options: product.weight_options || product.weightOptions,
    stock: product.stock,
    stockStatus: product.stockStatus,
});

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState(() => {
        try {
            const stored = localStorage.getItem('store_wishlist');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    });

    // Keep a ref in sync with the latest wishlist so callbacks can read the
    // current state without re-creating themselves on every change.
    const wishlistRef = useRef(wishlist);
    useEffect(() => {
        wishlistRef.current = wishlist;
        localStorage.setItem('store_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const isInWishlist = useCallback(
        (productId) => wishlist.some((item) => item.id === productId),
        [wishlist]
    );

    const toggleWishlist = useCallback((product) => {
        if (!product?.id) return;
        // Decide the action based on current state (via ref) and fire the toast
        // exactly once. The toast is kept OUT of the setState updater because
        // React StrictMode double-invokes updaters in dev, which fired it twice.
        const exists = wishlistRef.current.some((item) => item.id === product.id);
        if (exists) {
            setWishlist((prev) => prev.filter((item) => item.id !== product.id));
            toast.success(`${product.name} removed from wishlist.`);
        } else {
            setWishlist((prev) => [...prev, normalizeProduct(product)]);
            toast.success(`${product.name} added to wishlist.`);
        }
    }, []);

    const removeFromWishlist = useCallback((productId) => {
        setWishlist((prev) => prev.filter((item) => item.id !== productId));
        toast.success('Item removed from wishlist.');
    }, []);

    const clearWishlist = useCallback(() => {
        setWishlist([]);
    }, []);

    return (
        <WishlistContext.Provider
            value={{ wishlist, isInWishlist, toggleWishlist, removeFromWishlist, clearWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
