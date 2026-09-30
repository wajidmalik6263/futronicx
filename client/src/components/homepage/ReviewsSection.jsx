import React, { useState, useEffect, useMemo } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReviewsSection({ config }) {
    const heading = config?.heading || 'What Our Customers Say';
    const reviews = config?.reviews || [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [perView, setPerView] = useState(3);

    // Responsive slides-per-view: 1 on mobile, 2 on tablet, 3 on desktop.
    useEffect(() => {
        const computePerView = () => {
            const w = window.innerWidth;
            if (w < 640) return 1;
            if (w < 1024) return 2;
            return 3;
        };
        const update = () => setPerView(computePerView());
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Last index the slider can rest on so the final card stays fully visible.
    const maxIndex = useMemo(
        () => Math.max(0, reviews.length - perView),
        [reviews.length, perView]
    );

    // Keep the active index in range when perView / review count changes.
    useEffect(() => {
        setCurrentIndex(prev => Math.min(prev, maxIndex));
    }, [maxIndex]);

    // Auto-advance the slider one card at a time.
    useEffect(() => {
        if (reviews.length <= perView || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
        }, 4000);
        return () => clearInterval(interval);
    }, [reviews.length, perView, maxIndex, isPaused]);

    const goPrev = () => setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    const goNext = () => setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));

    if (reviews.length === 0) return null;

    const canSlide = reviews.length > perView;

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623] text-[#3A2E1F] text-xs font-bold uppercase tracking-wider">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Testimonials</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">{heading}</h2>
            </div>

            <div
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentIndex * (100 / perView)}%)` }}
                    >
                        {reviews.map((review, idx) => (
                            <div
                                key={idx}
                                className="shrink-0 px-3"
                                style={{ width: `${100 / perView}%` }}
                            >
                                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col relative h-full">
                                    <Quote className="w-8 h-8 text-[#F5A623]/30 absolute top-5 right-5" />

                                    {/* Stars */}
                                    <div className="flex items-center gap-0.5 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < (review.rating || 5) ? 'text-[#F5A623] fill-current' : 'text-[#E8DEC8]'}`}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed flex-1 font-body mb-4">
                                        "{review.text}"
                                    </p>

                                    <div className="flex items-center gap-3 pt-3 border-t border-[#E8DEC8]/50">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5A623] to-[#D97706] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {review.name ? review.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-[#3A2E1F]">{review.name}</div>
                                            {review.location && (
                                                <div className="text-[11px] text-[#3A2E1F]/80">{review.location}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {canSlide && (
                    <>
                        {/* Arrows */}
                        <button
                            type="button"
                            onClick={goPrev}
                            aria-label="Previous reviews"
                            className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-4 w-11 h-11 rounded-full bg-white border border-[#E8DEC8] hover:bg-[#F5A623] hover:border-[#F5A623] text-[#3A2E1F] flex items-center justify-center transition-all shadow-md z-10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            aria-label="Next reviews"
                            className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-4 w-11 h-11 rounded-full bg-white border border-[#E8DEC8] hover:bg-[#F5A623] hover:border-[#F5A623] text-[#3A2E1F] flex items-center justify-center transition-all shadow-md z-10"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={() => setCurrentIndex(dotIdx)}
                                    className="group flex items-center justify-center h-8 w-8 shrink-0"
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                    aria-current={currentIndex === dotIdx ? 'true' : undefined}
                                >
                                    <span
                                        className={`block h-2 rounded-full transition-all duration-300 ${currentIndex === dotIdx ? 'w-6 bg-[#D97706]' : 'w-2 bg-[#E8DEC8] group-hover:bg-[#F5A623]'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
