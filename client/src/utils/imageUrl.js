/**
 * Image URL helpers.
 *
 * Cloudinary can resize and convert images to modern formats (WebP/AVIF) on the
 * fly by inserting transformation parameters into the delivery URL. Uploaded
 * originals are often huge (e.g. a 1600px PNG logo), so we rewrite the URL to
 * request an appropriately-sized, auto-format, auto-quality version.
 *
 * For non-Cloudinary URLs the original is returned unchanged.
 */

/**
 * Optimize a Cloudinary image URL.
 *
 * @param {string} url - the original image URL
 * @param {object} [opts]
 * @param {number} [opts.width] - target width in px (Cloudinary `w_`)
 * @param {number} [opts.height] - target height in px (Cloudinary `h_`)
 * @param {string} [opts.crop='limit'] - crop mode (`c_`); 'limit' never upscales
 * @param {number} [opts.dpr=1.5] - device-pixel-ratio cap. Kept modest so we
 *   ship crisp-enough images without over-delivering 2x/3x bytes (the
 *   Lighthouse "Improve image delivery" finding). Pass `dpr: 1` for purely
 *   decorative images (logos) where retina sharpness is not important.
 * @returns {string} an optimized URL, or the original if not a Cloudinary URL
 */
export function optimizeImage(url, opts = {}) {
    if (!url || typeof url !== 'string') return url;

    const { width, height, crop = 'limit', dpr = 1.5 } = opts;

    // ---- Cloudinary ----
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        // Build the transformation segment. f_auto = best format, q_auto = smart quality.
        // We pin an explicit DPR instead of `dpr_auto`: `dpr_auto` lets the CDN
        // serve up to the device's full 2x/3x ratio, which returned images at
        // ~2x their display size (e.g. a 400x300 request came back 640x480) and
        // is exactly what Lighthouse flagged. A modest cap keeps them sharp
        // while cutting the transferred bytes roughly in half.
        const parts = ['f_auto', 'q_auto'];
        if (dpr && dpr !== 1) parts.push(`dpr_${dpr}`);
        if (width) parts.push(`w_${Math.round(width)}`);
        if (height) parts.push(`h_${Math.round(height)}`);
        if (width || height) parts.push(`c_${crop}`);
        const transform = parts.join(',');

        // Insert the transform right after '/upload/'. Avoid double-inserting if a
        // transform (e.g. one starting with f_/q_/w_) is already present.
        return url.replace(/\/upload\/(?!f_|q_|w_|h_|c_|dpr_)/, `/upload/${transform}/`);
    }

    // ---- Unsplash ----
    // Unsplash's imgix pipeline resizes/converts on the fly via query params.
    // Requesting an appropriately sized, auto-format image avoids shipping a
    // full-resolution photo (the Lighthouse "Improve image delivery" finding).
    if (url.includes('images.unsplash.com')) {
        try {
            const u = new URL(url);
            u.searchParams.set('auto', 'format');
            u.searchParams.set('fit', 'crop');
            u.searchParams.set('q', '70');
            if (width) u.searchParams.set('w', String(Math.round(width)));
            if (height) u.searchParams.set('h', String(Math.round(height)));
            return u.toString();
        } catch {
            return url;
        }
    }

    // Non-optimizable host — return unchanged.
    return url;
}
