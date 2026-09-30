import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../hooks/useCurrency';

export default function MobileCartBar() {
    const location = useLocation();
    const { cartItems, lastAddedItem, dismissLastAddedItem } = useCart();
    const { formatPrice } = useCurrency();
    const [showAddedBanner, setShowAddedBanner] = useState(false);

    useEffect(() => {
        if (lastAddedItem) {
            setShowAddedBanner(true);
            const timer = setTimeout(() => {
                setShowAddedBanner(false);
            }, 4500); // 4.5s preview banner for newly added item

            return () => clearTimeout(timer);
        }
    }, [lastAddedItem]);

    const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

    // Hide MobileCartBar on cart, checkout, and order confirmation views
    const hiddenRoutes = ['/cart', '/checkout', '/order-confirmation', '/confirmcheckout', '/confirm-checkout'];
    const isHidden = hiddenRoutes.some(path => location.pathname.toLowerCase().startsWith(path));

    // Only display if there are items in the cart and not on hidden routes
    if (isHidden || cartItems.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden animate-slideUp">
            <div className="bg-[#3A2E1F] text-[#F5EFE0] border-t-2 border-[#F5A623] shadow-2xl backdrop-blur-md">

                {/* 1. Newly Added Item Top Banner Notification */}
                {showAddedBanner && lastAddedItem && (
                    <div className="bg-[#2A2116] border-b border-[#F5A623]/30 px-3 py-2 flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <img
                                src={lastAddedItem.image}
                                alt={lastAddedItem.product_name}
                                className="w-9 h-9 rounded-lg object-cover border border-[#F5A623]/40 bg-[#FFFDF9] shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#F5A623]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                    <span>Added to Cart!</span>
                                </div>
                                <div className="text-xs font-bold text-white truncate">
                                    {lastAddedItem.product_name} <span className="text-[#F5A623] text-[10px]">({lastAddedItem.weight_option})</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddedBanner(false);
                                dismissLastAddedItem();
                            }}
                            className="text-[#F5EFE0]/60 hover:text-white p-1 rounded-full shrink-0"
                            aria-label="Close notification banner"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* 2. Persistent Mobile Cart Action Bar */}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative bg-[#F5A623]/15 p-2.5 rounded-xl border border-[#F5A623]/30 text-[#F5A623]">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="absolute -top-1.5 -right-1.5 bg-[#F5A623] text-[#3A2E1F] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#3A2E1F]">
                                {totalCount}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-[#F5EFE0]/70 uppercase tracking-wider block font-semibold">Cart Total:</span>
                            <div className="font-heading font-black text-base text-white">
                                {formatPrice(subtotal)}
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/cart"
                        className="px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
                    >
                        <span>View Cart</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
