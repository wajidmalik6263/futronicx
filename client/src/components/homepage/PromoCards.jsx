import React from 'react';
import { Link } from 'react-router-dom';
import { Percent, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { normalizeCtaLink } from '../../utils/ctaLink';

const iconMap = {
    percent: Percent,
    truck: Truck,
    shopping: ShoppingBag,
};

export default function PromoCards({ config }) {
    const cards = config?.cards || [];

    if (cards.length === 0) return null;

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className={`grid grid-cols-1 ${cards.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
                {cards.map((card, idx) => {
                    const isDark = card.theme === 'dark';
                    return (
                        <div
                            key={idx}
                            className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-lg flex flex-col justify-between group transition-all duration-300 ${isDark
                                    ? 'bg-gradient-to-br from-[#3A2E1F] via-[#4A3B28] to-[#281F14] text-[#F5EFE0] border-[#F5A623]/30 hover:border-[#F5A623]'
                                    : 'bg-gradient-to-br from-[#F5EFE0] via-[#FFFDF9] to-[#F5A623]/20 text-[#3A2E1F] border-[#E8DEC8] shadow-md hover:border-[#D97706]'
                                }`}
                        >
                            {isDark && <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-[#F5A623]/10 rounded-full blur-2xl pointer-events-none" />}
                            <div className="space-y-4 relative z-10">
                                {card.badge && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${isDark
                                            ? 'bg-[#F5A623] text-[#3A2E1F]'
                                            : 'bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30'
                                        }`}>
                                        {isDark ? <Percent className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                        <span>{card.badge}</span>
                                    </div>
                                )}
                                <h2 className={`font-body font-extrabold text-2xl sm:text-3xl leading-tight ${isDark ? 'text-white' : 'text-[#3A2E1F]'}`}>
                                    {card.heading}
                                </h2>
                                {card.body && (
                                    <p className={`text-xs sm:text-sm leading-relaxed font-body ${isDark ? 'text-[#F5EFE0]/80' : 'text-[#3A2E1F]/80'}`}>
                                        {card.body}
                                    </p>
                                )}
                            </div>
                            {card.ctaLink && (
                                <div className="pt-6 relative z-10">
                                    <Link
                                        to={normalizeCtaLink(card.ctaLink)}
                                        className={`inline-flex items-center gap-2 px-6 py-3 font-extrabold text-xs sm:text-sm rounded-full shadow-md transition-all active:scale-95 min-h-[44px] ${isDark
                                                ? 'bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white'
                                                : 'bg-[#3A2E1F] hover:bg-[#D97706] text-[#F5EFE0]'
                                            }`}
                                    >
                                        {isDark ? <ShoppingBag className="w-4 h-4" /> : null}
                                        <span>{card.ctaText || 'Shop Now'}</span>
                                        {!isDark && <ArrowRight className="w-4 h-4" />}
                                    </Link>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
