import React from 'react';

/**
 * HomeSkeleton — the single source of truth for the homepage loading layout.
 *
 * It is used in TWO places so the DOM structure is byte-identical at every
 * stage of loading and never causes a layout shift (CLS):
 *   1. As the React.lazy <Suspense> fallback for the Home route (first paint,
 *      while the Home chunk downloads).
 *   2. As Home's own `loading` state (while the homepage sections API resolves).
 *
 * Critically it reserves the SAME height (min-h-[2600px] sm:min-h-[2200px]) and
 * the SAME full-bleed hero (h-[600px] sm:h-[650px] lg:h-[700px]) that the loaded
 * page uses, so swapping between fallback -> loading -> loaded moves nothing.
 */
export default function HomeSkeleton() {
    return (
        <div className="space-y-10 sm:space-y-16 pb-16 min-h-[2600px] sm:min-h-[2200px]">
            {/* Hero section skeleton — matches the full-width dark hero layout */}
            <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[600px] sm:h-[650px] lg:h-[700px] overflow-hidden bg-[#2A2116]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A2116] via-[#2A2116]/90 to-[#2A2116]/60" />
                <div className="relative z-20 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-16">
                    <div className="max-w-2xl space-y-5">
                        {/* Badge — real text (not a pulse bar) so the hero looks
                            complete at first paint and matches the live HeroBanner. */}
                        <div className="flex items-center gap-2 text-[#F5A623] text-xs sm:text-sm font-bold tracking-wider uppercase">
                            <span className="w-6 h-[2px] bg-[#F5A623] inline-block" />
                            <span>New Collection 2026</span>
                        </div>
                        {/* Title — rendered as a REAL <h1> (not a skeleton bar) so the
                            Largest Contentful Paint element exists in the DOM at first
                            paint. This removes the multi-second "element render delay"
                            LCP was suffering while waiting for the homepage API.

                            IMPORTANT: this text MUST match the first hero slide's
                            headline that the site actually serves (the seeded default
                            in server/db/db.js — "Premium Quality Products For Your
                            Lifestyle", split by HeroBanner at the word midpoint into
                            "Premium Quality Products" / "For Your Lifestyle"). If the
                            skeleton h1 text differs from the real h1, Lighthouse pins
                            LCP to the LATER real-hero paint (after the /homepage fetch),
                            which is exactly the multi-second delay we are removing. */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight" style={{ fontFamily: "'Inter', 'Inter Fallback', 'Segoe UI', sans-serif" }}>
                            <span className="text-white">Premium Quality Products</span>
                            <br />
                            <span className="text-[#F5A623]">For Your Lifestyle</span>
                        </h1>
                        {/* Location — real text to match the live hero. */}
                        <div className="flex items-center gap-2 text-[#4ade80] text-xs sm:text-sm font-medium">
                            <span className="w-5 h-[2px] bg-[#4ade80] inline-block" />
                            <span>Gilgit-Baltistan · Pakistan</span>
                        </div>
                        {/* Subtitle — real text to match the live hero. */}
                        <p className="text-white/80 text-sm sm:text-base max-w-lg leading-relaxed">
                            Discover our handpicked selection of premium products, sourced from trusted suppliers.
                        </p>
                        {/* Rating */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-4 h-4 rounded-sm bg-white/8 animate-pulse" style={{ animationDelay: `${0.3 + i * 0.05}s` }} />
                                ))}
                            </div>
                            <div className="h-3 w-8 rounded-sm bg-white/8 animate-pulse" />
                            <div className="h-3 w-20 rounded-sm bg-white/8 animate-pulse" />
                        </div>
                        {/* CTA buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="h-11 w-40 rounded-full bg-white/8 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            <div className="h-11 w-32 rounded-full bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        </div>
                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-7 w-28 rounded-full bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: `${0.55 + i * 0.08}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
