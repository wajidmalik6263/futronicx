import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

export default function SEO({
    title,
    rawTitle,
    description,
    canonical,
    ogImage,
    type = 'website',
    noindex = false,
    structuredData,
}) {
    const { settings } = useSettings();
    const storeName = settings.store_name || 'North Dry Fruits';

    // ----------------------------------------------------
    // Dynamic Site URL
    // ----------------------------------------------------
    const siteUrl = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, "");

    // ----------------------------------------------------
    // Canonical resolution — always emit EXACTLY ONE canonical.
    //
    // Accepts absolute URLs, root-relative paths ("/products") or empty/undefined.
    // When nothing usable is passed we fall back to the current route so every
    // page still gets a single, correct canonical (avoids Lighthouse's
    // "Multiple conflicting URLs" / "no valid rel=canonical").
    // ----------------------------------------------------
    const resolveCanonical = () => {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        let raw = (canonical || '').trim();

        // Fall back to the current path when no explicit canonical was provided.
        if (!raw) raw = currentPath;

        let absolute;
        if (/^https?:\/\//i.test(raw)) {
            absolute = raw;
        } else {
            // Treat as a root-relative path.
            const path = raw.startsWith('/') ? raw : `/${raw}`;
            absolute = `${siteUrl}${path}`;
        }

        // Collapse accidental double slashes in the path (keep protocol "://").
        absolute = absolute.replace(/([^:]\/)\/+/g, '$1');

        // Normalise: strip a trailing slash except for the bare origin ("/").
        try {
            const u = new URL(absolute);
            if (u.pathname !== '/' && u.pathname.endsWith('/')) {
                u.pathname = u.pathname.replace(/\/+$/, '');
            }
            return u.toString();
        } catch {
            return absolute;
        }
    };

    const canonicalUrl = siteUrl ? resolveCanonical() : null;

    // ----------------------------------------------------
    // Guarantee exactly ONE <link rel="canonical"> in the DOM.
    //
    // In an SPA, react-helmet-async can momentarily leave a previous route's
    // canonical (e.g. the home "/" canonical) in <head> while the new route
    // mounts its own. Lighthouse then reports "Multiple conflicting URLs".
    // This effect removes any stale/duplicate canonical links whenever the
    // resolved canonical changes, so only the current page's canonical remains.
    // ----------------------------------------------------
    useEffect(() => {
        if (typeof document === 'undefined' || !canonicalUrl) return;
        const links = document.querySelectorAll('link[rel="canonical"]');
        links.forEach((link) => {
            if (link.getAttribute('href') !== canonicalUrl) {
                link.parentNode?.removeChild(link);
            }
        });
    }, [canonicalUrl]);

    let processedStructuredData = structuredData;
    if (processedStructuredData) {
        processedStructuredData = typeof processedStructuredData === 'string' ? processedStructuredData : JSON.stringify(processedStructuredData);
    }
    // ----------------------------------------------------

    const fullTitle = rawTitle
        ? rawTitle
        : title
            ? `${title} | ${storeName}`
            : `${storeName} - Premium Products`;
    const metaDescription = description || settings.store_tagline || 'Premium natural products delivered straight to your door.';

    // Ensure we have an absolute URL for fallback image
    const fallbackImage = `${siteUrl}/placeholder.png`;
    let metaImage = ogImage || settings.hero_image_url || fallbackImage;

    // Social link scrapers (WhatsApp, Facebook, X, LinkedIn) silently drop the
    // preview image when og:image is more than a few hundred KB. Our Cloudinary
    // originals are often 1-3 MB PNGs. For Cloudinary URLs, inject a transform
    // right after "/upload/" so the shared image is a 1200x630 optimised JPEG
    // (~100-150 KB). Mirrors server/routes/prerender.js so pre- and post-hydrate
    // og:image match. The stored original is untouched.
    const OG_TRANSFORM = 'w_1200,h_630,c_fill,g_auto,f_jpg,q_auto:good';
    if (
        typeof metaImage === 'string' &&
        /res\.cloudinary\.com\/.+\/upload\//.test(metaImage) &&
        !new RegExp(`/upload/${OG_TRANSFORM.split(',')[0]}`).test(metaImage)
    ) {
        metaImage = metaImage.replace(/\/upload\/(?!v\d+\/[^/]*[a-z]_[^/]+)/, `/upload/${OG_TRANSFORM}/`);
    }

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:site_name" content={storeName} />
            <meta property="og:locale" content={settings.locale || "en_US"} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:type" content={type} />
            {metaImage && <meta property="og:image" content={metaImage} />}
            {metaImage && <meta property="og:image:width" content="1200" />}
            {metaImage && <meta property="og:image:height" content="630" />}
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            {settings.social_twitter && <meta name="twitter:site" content={settings.social_twitter} />}
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            {metaImage && <meta name="twitter:image" content={metaImage} />}

            {/* JSON-LD Structured Data */}
            {processedStructuredData && (
                <script type="application/ld+json">
                    {processedStructuredData}
                </script>
            )}
        </Helmet>
    );
}
