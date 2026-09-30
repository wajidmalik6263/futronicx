// Canonical site origin for server-rendered metadata + JSON-LD. On the client
// the old components read window.location.origin; on the server there is no
// window, so we resolve a fixed origin from env (falls back to production).
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://northdryfruits.com'
).replace(/\/$/, '');
