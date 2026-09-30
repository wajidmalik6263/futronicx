import React, { useState, useRef, useEffect } from 'react';

/**
 * LazySection — defers rendering of below-fold homepage sections until they
 * are near the viewport. This prevents unnecessary API calls, image downloads,
 * and React rendering work for content the user hasn't scrolled to yet.
 *
 * Props:
 *  - children: the section component to render once visible
 *  - height: minimum placeholder height (default: '200px')
 *  - rootMargin: how far before the viewport to start loading (default: '400px')
 *  - className: optional classes on the wrapper
 *  - fallback: optional custom placeholder while section hasn't loaded
 */
export default function LazySection({
    children,
    height = '200px',
    rootMargin = '600px',
    className = '',
    fallback = null,
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // If IntersectionObserver is not supported, render immediately
        if (!('IntersectionObserver' in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { rootMargin, threshold: 0 }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [rootMargin]);

    if (isVisible) {
        // Keep the reserved minHeight on the wrapper so swapping the placeholder
        // for real content does not collapse/expand the box and cause layout shift.
        return <div className={className} style={{ minHeight: height }}>{children}</div>;
    }

    return (
        <div ref={ref} className={className} style={{ minHeight: height }}>
            {fallback || (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div
                        className="rounded-2xl bg-[#F5EFE0]/30 border border-[#E8DEC8]/50 animate-pulse"
                        style={{ height }}
                    />
                </div>
            )}
        </div>
    );
}
