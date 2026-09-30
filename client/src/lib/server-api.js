import 'server-only';

// ---------------------------------------------------------------------------
// Server-side data layer for SSR/ISR pages.
//
// Client components fetch through axios + the relative "/api" base (browser
// origin). Server Components have NO browser origin, so they must call the
// Express API by its absolute URL. We resolve that from an env var so the same
// code works in dev (localhost:5000) and prod (real API host).
//
// Caching is expressed per-call via Next's fetch cache options so each route
// can pick its own strategy (see the wrappers at the bottom):
//   - product detail  -> no-store (always fresh)
//   - product listing -> revalidate 60s
//   - blog            -> revalidate 3600s
//   - about/contact   -> revalidate 86400s
// ---------------------------------------------------------------------------

// SERVER_API_URL is the internal, absolute base the Next server uses to reach
// Express. Falls back to the public URL, then to localhost for local dev.
const API_BASE = (
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api'
).replace(/\/$/, '');

/**
 * Low-level JSON GET against the Express API.
 * @param {string} path - path beginning with "/" (e.g. "/products")
 * @param {object} [opts]
 * @param {Record<string,string|number|undefined>} [opts.params] - query params
 * @param {number|false} [opts.revalidate] - ISR window in seconds, or false for no-store
 * @returns {Promise<any|null>} parsed JSON, or null on 404 / network failure
 */
async function apiGet(path, { params, revalidate } = {}) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  // revalidate === false        -> always fresh (no-store, dynamic SSR)
  // revalidate === 'force-cache' -> cache indefinitely (pure SSG, rebuild only)
  // revalidate === <number>      -> ISR window in seconds
  const fetchOpts =
    revalidate === false
      ? { cache: 'no-store' }
      : revalidate === 'force-cache'
        ? { cache: 'force-cache' }
        : { next: { revalidate: revalidate ?? 60 } };

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      // Real HTTP error from a reachable API — worth surfacing.
      console.error(`[server-api] ${path} -> HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    // Distinguish "backend not reachable" (API/DB down — expected in local dev
    // without the Express server) from other failures. In the unreachable case
    // we degrade gracefully (page renders with empty defaults) and log a single
    // concise warning instead of an alarming multi-line stack trace.
    const cause = err?.cause;
    const unreachable =
      err?.code === 'ECONNREFUSED' ||
      cause?.code === 'ECONNREFUSED' ||
      cause?.code === 'ENOTFOUND' ||
      err?.message === 'fetch failed';
    if (unreachable) {
      console.warn(
        `[server-api] API unreachable at ${API_BASE}${path} — serving empty data. Is the backend running?`
      );
    } else {
      console.error(`[server-api] ${path} failed:`, err.message);
    }
    return null;
  }
}

// ----- Site settings (flat key/value object) --------------------------------
// Used by about/contact server pages and to seed SettingsProvider on the client.
export function getSettings(revalidate = 86400) {
  return apiGet('/settings', { revalidate }).then((d) => d || {});
}

// ----- Products -------------------------------------------------------------

/** Product listing. Returns { products, pagination }. ISR 60s by default. */
export function getProducts(params = {}, revalidate = 60) {
  return apiGet('/products', { params, revalidate }).then(
    (d) => d || { products: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }
  );
}

/**
 * Single product by slug. ISR 5 min by default so the detail page can be
 * statically generated + cached (SSG+ISR) rather than server-rendered per
 * request. Admin edits trigger instant on-demand revalidation via the
 * /api/revalidate route, and add-to-cart re-checks live stock separately, so
 * the cached page stays accurate without per-request rendering.
 */
export function getProductBySlug(slug, revalidate = 300) {
  return apiGet(`/products/${encodeURIComponent(slug)}`, { revalidate });
}

// ----- Categories -----------------------------------------------------------

/** Product categories (array). ISR 60s to match the listing pages. */
export function getCategories(revalidate = 60) {
  return apiGet('/categories', { revalidate }).then((d) => (Array.isArray(d) ? d : []));
}

// ----- Homepage sections ----------------------------------------------------

/** Visible homepage sections (array), ISR 60s. Used to source the hero copy/image. */
export function getHomepageSections(revalidate = 60) {
  return apiGet('/homepage', { revalidate }).then((d) => (Array.isArray(d) ? d : []));
}

// ----- Blogs ----------------------------------------------------------------

/** Blog listing. Returns { blogs, totalPages, page, limit, total }. ISR hourly. */
export function getBlogs(params = {}, revalidate = 3600) {
  return apiGet('/blogs', { params, revalidate }).then(
    (d) => d || { blogs: [], totalPages: 0, page: 1, limit: 10, total: 0 }
  );
}

/** Single blog article by slug. ISR hourly. */
export function getBlogBySlug(slug) {
  return apiGet(`/blogs/${encodeURIComponent(slug)}`, { revalidate: 3600 });
}

/** Blog categories. Returns { categories: string[], data: object[] }. ISR hourly. */
export function getBlogCategories(revalidate = 3600) {
  return apiGet('/blogs/categories', { revalidate }).then(
    (d) => d || { categories: [], data: [] }
  );
}
