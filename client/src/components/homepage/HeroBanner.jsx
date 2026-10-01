import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Truck, Banknote, Leaf, MapPin } from 'lucide-react';
import { optimizeImage } from '../../utils/imageUrl';
import { normalizeCtaLink } from '../../utils/ctaLink';

const TRUST_BADGES = [
    { icon: Truck, label: 'Express Delivery' },
    { icon: Banknote, label: 'Money back guarantee' },
    
];

export default function HeroBanner({ config }) {
    const slides = config?.slides || [];
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToSlide = useCallback((index) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        goToSlide((currentSlide + 1) % slides.length);
    }, [currentSlide, slides.length, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
    }, [currentSlide, slides.length, goToSlide]);

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;
        const timer = setInterval(nextSlide, 6000);
        return () => clearInterval(timer);
    }, [isPaused, slides.length, nextSlide]);

    if (slides.length === 0) {
        return (
            <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[600px] sm:h-[650px] lg:h-[700px] overflow-hidden bg-[#2A2116]">
                {/* Dark gradient background placeholder */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A2116] via-[#2A2116]/90 to-[#2A2116]/60" />

                {/* Skeleton content matching real layout */}
                <div className="relative z-20 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-16">
                    <div className="max-w-2xl space-y-5">
                        {/* Badge skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-[2px] bg-white/10 rounded" />
                            <div className="h-3 w-28 rounded-sm bg-white/8 animate-pulse" />
                        </div>

                        {/* Title skeleton - two lines */}
                        <div className="space-y-3">
                            <div className="h-10 sm:h-14 w-[80%] rounded bg-white/8 animate-pulse" />
                            <div className="h-10 sm:h-14 w-[55%] rounded bg-white/8 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        </div>

                        {/* Location skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-[2px] bg-white/10 rounded" />
                            <div className="h-3 w-40 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.15s' }} />
                        </div>

                        {/* Subtitle skeleton */}
                        <div className="space-y-2">
                            <div className="h-3.5 w-[90%] rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="h-3.5 w-[70%] rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: '0.25s' }} />
                        </div>

                        {/* Rating skeleton */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-4 h-4 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: `${0.3 + i * 0.05}s` }} />
                                ))}
                            </div>
                            <div className="h-3 w-8 rounded-sm bg-white/8 animate-pulse" />
                            <div className="h-3 w-20 rounded-sm bg-white/8 animate-pulse" />
                        </div>

                        {/* CTA buttons skeleton */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="h-11 w-40 rounded-full bg-white/8 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            <div className="h-11 w-32 rounded-full bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Trust badges skeleton */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-7 w-28 rounded-full bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: `${0.55 + i * 0.08}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const slide = slides[currentSlide];

    return (
        <section
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[600px] sm:h-[650px] lg:h-[700px] overflow-hidden"
            aria-label="Hero banner slider"
        >
            {/* Background Image with Dark Overlay */}
            {slides.map((s, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img
                        src={optimizeImage(s.image, { width: 1600, height: 700, crop: 'fill' })}
                        alt={s.title}
                        width="1920"
                        height="700"
                        className="w-full h-full object-cover"
                        fetchPriority={idx === 0 ? 'high' : 'low'}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#2A2116]/95 via-[#2A2116]/80 to-transparent" />
                </div>
            ))}

            {/* Content */}
            <div className="relative z-20 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-16">
                <div className="max-w-2xl space-y-4 sm:space-y-5">
                    {/* Badge */}
                    {slide.badge && (
                        <div className="flex items-center gap-2 text-[#F5A623] text-xs sm:text-sm font-bold tracking-wider  hero-slide-up" style={{ animationDelay: '0.1s' }}>
                            <span className="w-6 h-[2px] bg-[#F5A623] inline-block" />
                            <span>{slide.badge}</span>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-4xl font-extrabold leading-[1.4] tracking-tight hero-slide-up" style={{ fontFamily: "'Inter', 'Inter Fallback', 'Segoe UI', sans-serif" }}>
                        {(() => {
                            const title = slide.title || '';
                            // Split at & or newline for natural break
                            const ampersandIndex = title.indexOf('&');
                            let line1, line2;
                            if (ampersandIndex !== -1) {
                                line1 = title.substring(0, ampersandIndex + 1).trim();
                                line2 = title.substring(ampersandIndex + 1).trim();
                            } else {
                                const words = title.split(' ');
                                const mid = Math.ceil(words.length / 2);
                                line1 = words.slice(0, mid).join(' ');
                                line2 = words.slice(mid).join(' ');
                            }
                            return (
                                <>
                                    <span className="text-white">{line1}</span>
                                    {line2 && <> <span className="text-[#F5A623]">{line2}</span></>}
                                </>
                            );
                        })()}
                    </h1>

                    {/* Location */}
                  

                    {/* Subtitle */}
                    {slide.subtitle && (
                        <p className="text-white/80 text-sm sm:text-base max-w-lg leading-relaxed hero-slide-up" style={{ animationDelay: '0.4s' }}>
                            {slide.subtitle}
                        </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-3 hero-slide-up" style={{ animationDelay: '0.45s' }}>
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                            ))}
                        </div>
                        <span className="text-white font-bold text-sm">4.9</span>
                        <span className="text-white/80 text-sm">· 2,400+ reviews</span>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 hero-slide-up" style={{ animationDelay: '0.5s' }}>
                        {slide.ctaLink && (
                            <Link
                                to={normalizeCtaLink(slide.ctaLink)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#F5B027] text-[#3A2E1F] font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                                <span>{slide.ctaText || 'Explore Products'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        <Link
                            to="/about"
                            aria-label="Learn more about Us"
                            className="inline-flex items-center px-6 py-3 text-white font-bold text-sm rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300"
                        >
                            About Us
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 hero-slide-up" style={{ animationDelay: '0.6s' }}>
                        {TRUST_BADGES.map((badge, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium"
                            >
                                <badge.icon className="w-3.5 h-3.5 text-[#4ade80]" />
                                <span>{badge.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        aria-label="Previous slide"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        aria-label="Next slide"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Slide Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => goToSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            aria-current={currentSlide === idx ? 'true' : undefined}
                            className="group flex items-center justify-center w-8 h-11 px-1"
                        >
                            {/* Visible pill — small, but the button hit area is 24px+ for accessibility */}
                            <span
                                className={`block h-2 rounded-full transition-all duration-300 ${currentSlide === idx
                                    ? 'w-8 bg-[#F5A623]'
                                    : 'w-2 bg-white/50 group-hover:bg-white/80'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
