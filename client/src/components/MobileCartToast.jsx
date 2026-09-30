import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../hooks/useCurrency';

export default function MobileCartToast() {
    const { lastAddedItem, dismissLastAddedItem, cartItems } = useCart();
    const { formatPrice } = useCurrency();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (lastAddedItem) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 4500); // Auto-hide after 4.5s

            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [lastAddedItem]);

    if (!visible || !lastAddedItem) return null;

    const totalItemsCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

    return (
        <div className="fixed bottom-3 left-3 right-3 z-[9999] md:hidden animate-slideUp">
            <div className="bg-[#3A2E1F]/95 backdrop-blur-lg border-2 border-[#F5A623] text-[#F5EFE0] p-3 rounded-2xl shadow-2xl space-y-2.5">
                {/* Top Notification Status Bar */}
                <div className="flex items-center justify-between border-b border-[#F5EFE0]/15 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#F5A623]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        <span>Added to Cart!</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setVisible(false);
                            dismissLastAddedItem();
                        }}
                        className="text-[#F5EFE0]/60 hover:text-white p-1 rounded-full transition-colors"
                        aria-label="Close notification"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Product Info Row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img
                            src={lastAddedItem.image}
                            alt={lastAddedItem.product_name}
                            className="w-11 h-11 rounded-xl object-cover border border-[#F5A623]/30 bg-[#FFFDF9] shrink-0"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                        />
                        <div className="min-w-0">
                            <h4 className="font-heading font-extrabold text-xs text-white truncate">
                                {lastAddedItem.product_name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-[#F5EFE0]/70 mt-0.5">
                                <span className="font-semibold text-[#F5A623]">
                                    {lastAddedItem.weight_option}
                                </span>
                                <span>•</span>
                                <span>Qty: {lastAddedItem.quantity}</span>
                                <span>•</span>
                                <span className="font-bold text-white">{formatPrice(lastAddedItem.price * lastAddedItem.quantity)}</span>
                            </div>
                        </div>
                    </div>

                    {/* View Cart / Checkout Action Button */}
                    <Link
                        to="/cart"
                        onClick={() => setVisible(false)}
                        className="px-3.5 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-black text-xs rounded-xl shadow-md flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                    >
                        <span>View ({totalItemsCount})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
