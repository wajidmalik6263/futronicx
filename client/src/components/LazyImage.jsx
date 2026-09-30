import React, { useState, useRef, useEffect } from 'react';
import { optimizeImage } from '../utils/imageUrl';

/**
 * LazyImage — loads images only when they enter the viewport.
 * Shows a lightweight placeholder with optional blur-up effect and fade-in transition.
 *
 * Props:
 *  - src: image URL
 *  - alt: alt text
 *  - className: classes applied to the <img> element
 *  - wrapperClassName: classes applied to the outer container div
 *  - placeholderColor: background color for the placeholder (default: warm beige)
 *  - rootMargin: IntersectionObserver rootMargin (default: '200px' to preload slightly before viewport)
 *  - width/height: target render size in px. When set, the src is rewritten to
 *    request a correctly-sized, auto-format (WebP/AVIF), auto-quality image from
 *    the CDN (Cloudinary/Unsplash) — this fixes Lighthouse "Improve image delivery".
 *  - crop: Cloudinary crop mode when width/height are given (default 'fill')
 *  - onError: custom error handler
 *  - ...rest: any other props forwarded to <img>
 */
export default function LazyImage({
    src,
    alt = '',
    className = '',
    wrapperClassName = '',
    placeholderColor = '#F5EFE0',
    rootMargin = '200px',
    width,
    height,
    crop = 'fill',
    onError,
    ...rest
}) {
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const element = imgRef.current;
        if (!element) return;

        // If IntersectionObserver is not supported, load immediately
        if (!('IntersectionObserver' in window)) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
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

    const handleLoad = () => {
        setIsLoaded(true);
    };

    // Rewrite the URL to request an optimized (auto-format, right-sized) version
    // from the CDN. Falls back to the original for non-CDN hosts.
    const optimizedSrc = (width || height)
        ? optimizeImage(src, { width, height, crop })
        : optimizeImage(src);

    const handleError = (e) => {
        setHasError(true);
        if (onError) {
            onError(e);
        } else {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
        }
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${wrapperClassName}`}
            style={{ backgroundColor: placeholderColor }}
        >
            {/* Placeholder shimmer while not loaded */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}

            {/* Actual image — only rendered when in viewport */}
            {isInView && (
                <img
                    src={optimizedSrc}
                    alt={alt}
                    className={`transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    decoding="async"
                    {...rest}
                />
            )}
        </div>
    );
}
