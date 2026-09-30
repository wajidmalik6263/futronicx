/**
 * Client-side product image validation.
 *
 * Product images render inside a SQUARE (1:1) box on the storefront and are
 * requested at 800x800 (see ProductDetail.jsx / imageUrl.js). Non-square or
 * too-small uploads get cropped or look blurry, so we validate before upload.
 *
 * Recommended source size: 1200x1200 (1:1). Minimum accepted: 800x800.
 */

// --- Tunable limits -------------------------------------------------------
export const IMAGE_RULES = {
    maxBytes: 5 * 1024 * 1024,        // 5 MB — matches the UI hint + server limit
    minWidth: 800,                    // storefront requests 800x800
    minHeight: 800,
    // How far from a perfect square we tolerate before warning. 0.05 = 5%.
    // A truly square image has ratio 1.0; we warn once |ratio - 1| exceeds this.
    squareTolerance: 0.05,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

/**
 * Read an image File's natural pixel dimensions.
 * @param {File} file
 * @returns {Promise<{width:number,height:number}>}
 */
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const dims = { width: img.naturalWidth, height: img.naturalHeight };
            URL.revokeObjectURL(url);
            resolve(dims);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read the image file.'));
        };
        img.src = url;
    });
}

/**
 * Validate a product image file.
 *
 * @param {File} file
 * @returns {Promise<{ ok: boolean, error?: string, warning?: string, width?: number, height?: number }>}
 *   - `ok: false` with `error`  -> hard failure, caller should reject the file.
 *   - `ok: true` with `warning` -> accepted, but caller should surface a heads-up
 *     (e.g. not perfectly square). `ok: true` with no warning -> all good.
 */
export async function validateProductImage(file) {
    if (!file) return { ok: false, error: 'No file selected.' };

    // Type check (accept="image/*" is not enforced by all browsers/OS pickers).
    if (file.type && !IMAGE_RULES.acceptedTypes.includes(file.type)) {
        return { ok: false, error: 'Unsupported format. Use JPG, PNG, or WEBP.' };
    }

    // Size check.
    if (file.size > IMAGE_RULES.maxBytes) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        return { ok: false, error: `Image is ${mb}MB. Maximum allowed is 5MB.` };
    }

    // Dimension check.
    let dims;
    try {
        dims = await getImageDimensions(file);
    } catch {
        return { ok: false, error: 'Could not read image dimensions. Try a different file.' };
    }

    const { width, height } = dims;

    if (width < IMAGE_RULES.minWidth || height < IMAGE_RULES.minHeight) {
        return {
            ok: false,
            width, height,
            error: `Image is ${width}×${height}px. Minimum is ${IMAGE_RULES.minWidth}×${IMAGE_RULES.minHeight}px (use a square 1200×1200 image for best results).`,
        };
    }

    // Square check (non-blocking warning).
    const ratio = width / height;
    if (Math.abs(ratio - 1) > IMAGE_RULES.squareTolerance) {
        return {
            ok: true,
            width, height,
            warning: `Image is ${width}×${height}px (not square). It will be cropped to a square on the product page. Upload a 1:1 image (e.g. 1200×1200) to avoid cropping.`,
        };
    }

    return { ok: true, width, height };
}
