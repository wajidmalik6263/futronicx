import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from '../utils/toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const stored = localStorage.getItem('store_cart');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    });

    const [lastAddedItem, setLastAddedItem] = useState(null);

    useEffect(() => {
        localStorage.setItem('store_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addItem = (product, weightOption, quantity) => {
        const selectedWeightLabel = weightOption?.label || 'Standard';
        const selectedPrice = weightOption?.price || product.base_price || product.basePrice || 0;
        const itemQuantity = quantity || 1;

        setCartItems(prev => {
            // Check if item with same id and weight already exists
            const existingKey = prev.findIndex(item => item.product_id === product.id && item.weight_option === selectedWeightLabel);
            if (existingKey >= 0) {
                const updated = [...prev];
                updated[existingKey].quantity += itemQuantity;
                return updated;
            }
            return [...prev, {
                product_id: product.id,
                slug: product.slug,
                product_name: product.name,
                image: product.images?.[0] || product.image_url,
                weight_option: selectedWeightLabel,
                price: selectedPrice,
                quantity: itemQuantity
            }];
        });

        // Set last added item state for mobile sticky bar notification
        setLastAddedItem({
            product_id: product.id,
            slug: product.slug,
            product_name: product.name,
            image: product.images?.[0] || product.image_url,
            weight_option: selectedWeightLabel,
            price: selectedPrice,
            quantity: itemQuantity,
            timestamp: Date.now()
        });

        toast.success(`Added ${itemQuantity} x ${product.name} to cart.`);
    };

    const dismissLastAddedItem = () => {
        setLastAddedItem(null);
    };

    const removeItem = (productId, weightOption) => {
        setCartItems(prev => prev.filter(item => !(item.product_id === productId && item.weight_option === weightOption)));
        toast.success(`Item removed from cart.`);
    };

    const updateQuantity = (productId, weightOption, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.product_id === productId && item.weight_option === weightOption) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{ cartItems, addItem, removeItem, updateQuantity, clearCart, lastAddedItem, dismissLastAddedItem }}>
            {children}
        </CartContext.Provider>
    );
};
