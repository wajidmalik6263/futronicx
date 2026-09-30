// ==========================================================================
// SEO-friendly slug utilities (shared across blog + category URLs)
// --------------------------------------------------------------------------
// "Gilgit Baltistan Dry Fruits" -> "gilgit-baltistan-dry-fruits"
//   - lowercase
//   - spaces / underscores / plus signs -> single hyphen
//   - strips accents/diacritics
//   - removes all other special characters
//   - collapses repeated hyphens, trims leading/trailing hyphens
//   - never produces the reserved segment "page" (would collide with
//     /blog/page/:n pagination) — appended with a suffix if it ever does.
// ==========================================================================

const RESERVED_SEGMENTS = new Set(['page']);

export function slugify(input) {
    if (input == null) return '';
    let slug = String(input)
        .normalize('NFKD')                 // split accented chars
        .replace(/[\u0300-\u036f]/g, '')   // drop diacritic marks
        .toLowerCase()
        .trim()
        .replace(/[+_\s]+/g, '-')          // spaces / underscores / plus -> hyphen
        .replace(/[^a-z0-9-]/g, '')        // drop anything not url-safe
        .replace(/-+/g, '-')               // collapse repeated hyphens
        .replace(/^-+|-+$/g, '');          // trim edge hyphens

    if (RESERVED_SEGMENTS.has(slug)) slug = `${slug}-category`;
    return slug;
}

// Resolve a category object from the API `data` array (which carries real
// DB slugs) by matching either its stored slug or a slugified name. This keeps
// URLs stable (prefers the DB slug) while still working if only names exist.
export function findCategoryBySlug(categoryData, slug) {
    if (!Array.isArray(categoryData) || !slug) return null;
    const target = slug.toLowerCase();
    return (
        categoryData.find((c) => (c.slug || '').toLowerCase() === target) ||
        categoryData.find((c) => slugify(c.name) === target) ||
        null
    );
}

// Prefer the DB slug when present; otherwise derive one from the name.
export function categorySlug(category) {
    if (!category) return '';
    if (typeof category === 'string') return slugify(category);
    return (category.slug && category.slug.trim()) ? category.slug : slugify(category.name);
}

// ---- URL builders (single source of truth for blog links) ----
export function blogListUrl(page = 1) {
    return page > 1 ? `/blog/page/${page}` : '/blog';
}

export function blogCategoryUrl(slug, page = 1) {
    const base = `/blog/${slug}`;
    return page > 1 ? `${base}/page/${page}` : base;
}

export function blogArticleUrl(slug) {
    return `/blog/${slug}`;
}
