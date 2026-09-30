import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShieldCheck, Truck, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../hooks/useCurrency';
import SEO from '../components/SEO';

export default function Cart() {
    const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
    // Shipping is always free — no charges on any order.
    const shippingFee = 0;
    const grandTotal = subtotal + shippingFee;

    const isCartEmpty = cartItems.length === 0;

    return (
        <div className="space-y-10 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
            <SEO title={`Shopping Cart - ${settings?.store_name || 'North Dry Fruits'}`} description={settings?.store_tagline || "Review your selected items before checkout."} noindex={true} />
            {/* HEADER BANNER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E8DEC8] pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold font-heading text-[#3A2E1F]">Shopping Cart</h1>
                    <p className="text-xs text-[#3A2E1F]/70">
                        {isCartEmpty ? 'Your cart is currently empty' : `You have ${cartItems.length} unique item(s) in your cart`}
                    </p>
                </div>
                <Link to="/products" className="text-xs font-bold text-[#3A2E1F] hover:text-[#D97706] flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Continue Shopping</span>
                </Link>
            </div>

            {!isCartEmpty ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* LINE ITEMS LIST */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm space-y-6">

                            <div className="hidden sm:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-[#3A2E1F]/60 pb-3 border-b border-[#E8DEC8]">
                                <div className="col-span-6">Product</div>
                                <div className="col-span-2 text-center">Price</div>
                                <div className="col-span-2 text-center">Quantity</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>

                            {cartItems.map((item) => (
                                <div key={`${item.product_id}-${item.weight_option}`} className="flex flex-col sm:grid sm:grid-cols-12 items-center gap-4 py-4 border-b border-[#E8DEC8]/60 last:border-0">
                                    <div className="col-span-6 flex items-center gap-4 w-full">
                                        <img src={item.image} alt={item.product_name} className="w-20 h-20 rounded-2xl object-cover border border-[#E8DEC8] bg-[#F5EFE0]" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                        <div className="space-y-1">
                                            <Link to={`/product/${item.slug}`} className="font-heading font-bold text-sm text-[#3A2E1F] hover:text-[#D97706]">
                                                {item.product_name}
                                            </Link>
                                            <span className="text-xs text-[#D97706] font-semibold block">
                                                Weight: {item.weight_option}
                                            </span>
                                            <button type="button" onClick={() => removeItem(item.product_id, item.weight_option)} className="text-xs text-rose-600 hover:underline flex items-center gap-1 pt-1">
                                                <Trash2 className="w-3.5 h-3.5" /><span>Remove</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-center text-xs font-semibold text-[#3A2E1F] hidden sm:block">
                                        {formatPrice(item.price || 0)}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex items-center bg-[#F5EFE0] border border-[#E8DEC8] rounded-full p-1">
                                            <button type="button" onClick={() => updateQuantity(item.product_id, item.weight_option, -1)} className="w-7 h-7 rounded-full bg-white text-[#3A2E1F] hover:bg-[#F5A623] flex items-center justify-center transition-colors">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold text-[#3A2E1F]">{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.product_id, item.weight_option, 1)} className="w-7 h-7 rounded-full bg-white text-[#3A2E1F] hover:bg-[#F5A623] flex items-center justify-center transition-colors">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right font-heading font-extrabold text-sm text-[#3A2E1F] w-full sm:w-auto flex sm:block justify-between items-center border-t sm:border-0 pt-2 sm:pt-0">
                                        <span className="sm:hidden text-xs text-[#3A2E1F]/60">Total:</span>
                                        <span>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between pt-2">
                                <button type="button" onClick={clearCart} className="text-xs text-[#3A2E1F]/70 hover:text-rose-600 font-semibold">
                                    Clear Cart
                                </button>
                                <span className="text-xs text-[#3A2E1F]/70">Prices include all local taxes</span>
                            </div>
                        </div>
                    </div>

                    {/* ORDER SUMMARY */}
                    <aside className="space-y-6">
                        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm space-y-6 sticky top-28">
                            <h2 className="font-heading font-bold text-xl text-[#3A2E1F] border-b border-[#E8DEC8] pb-3">Order Summary</h2>

                            <div className="space-y-3 text-sm text-[#3A2E1F]/80">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-[#3A2E1F]">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping Fee</span>
                                    <span className="font-bold text-[#3A2E1F]">
                                        {shippingFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(shippingFee)}
                                    </span>
                                </div>
                                {subtotal > 0 && (
                                    <div className="p-3 bg-[#F5EFE0]/70 rounded-2xl text-[11px] text-emerald-700 font-semibold">
                                        <strong>Free delivery</strong> on all orders — no shipping charges!
                                    </div>
                                )}
                                <div className="pt-3 border-t border-[#E8DEC8] flex justify-between items-baseline">
                                    <span className="font-heading font-bold text-base text-[#3A2E1F]">Grand Total</span>
                                    <span className="font-heading font-extrabold text-2xl text-[#3A2E1F]">{formatPrice(grandTotal)}</span>
                                </div>
                            </div>

                            <Link to="/checkout" className="w-full py-3.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full shadow-md transition-all text-center flex items-center justify-center gap-2">
                                <span>Proceed to Checkout</span><ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-6 max-w-xl mx-auto shadow-sm my-8">
                    <div className="w-20 h-20 bg-[#F5EFE0] text-[#D97706] rounded-full flex items-center justify-center mx-auto border border-[#E8DEC8]">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-heading font-bold text-3xl text-[#3A2E1F]">{settings.empty_cart_heading || 'Your Cart is Empty'}</h2>
                        <p className="text-sm text-[#3A2E1F]/70 leading-relaxed font-body">{settings.empty_cart_text || "Looks like you haven't added any products to your cart yet."}</p>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full transition-colors shadow-sm">
                        <span>Explore Products</span><ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
