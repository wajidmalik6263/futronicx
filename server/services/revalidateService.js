// Fire-and-forget on-demand ISR revalidation.
//
// When a product / category / blog post changes, we ping the Next.js frontend's
// /api/revalidate route so the matching statically-generated page regenerates
// within seconds instead of waiting for its time-based ISR window. This is a
// best-effort, non-blocking call: if the frontend is unreachable or the feature
// is unconfigured, the admin action still succeeds and the page just refreshes
// on its normal ISR timer instead.
//
// Config (server .env):
//   REVALIDATE_URL     Base URL of the Next site, e.g. https://northdryfruits.com
//                      (defaults to CLIENT_ORIGIN's first entry, then localhost:5173)
//   REVALIDATE_SECRET  Must match the same-named var in the Next app's env.
//                      Leave blank to disable (no calls are made).

const RAW_BASE =
  process.env.REVALIDATE_URL ||
  (process.env.CLIENT_ORIGIN || '').split(',')[0].trim() ||
  'http://localhost:5173';

const BASE = RAW_BASE.replace(/\/$/, '');
const SECRET = process.env.REVALIDATE_SECRET || '';

/**
 * Trigger revalidation of the pages affected by a content change.
 * @param {object} payload - { type, slug, categorySlug, paths, tags }
 *   type: 'product' | 'category' | 'blog'
 * @returns {Promise<void>} resolves regardless of outcome (never throws)
 */
async function triggerRevalidate(payload = {}) {
  if (!SECRET) return; // feature disabled — no secret configured

  const url = `${BASE}/api/revalidate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': SECRET,
      },
      body: JSON.stringify(payload),
      // Don't let a slow/hanging frontend stall the admin request.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[revalidate] ${url} -> HTTP ${res.status} for`, payload);
    } else {
      const data = await res.json().catch(() => ({}));
      console.log('[revalidate] ok:', data.paths || payload);
    }
  } catch (err) {
    // Unreachable frontend, timeout, DNS, etc. — non-fatal.
    console.warn(`[revalidate] failed (${err.name}): ${err.message}`);
  }
}

module.exports = { triggerRevalidate };
