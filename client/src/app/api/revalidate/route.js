// On-demand ISR revalidation endpoint.
//
// The Express backend calls this route whenever a product / blog post / category
// is created, updated or deleted so the corresponding statically-generated Next
// page regenerates within seconds — instead of waiting for its time-based ISR
// window (products 5m, listings/blog 1h). This lets us keep long, cheap ISR
// windows as a safety net while freshness is driven by real content events.
//
// Security: a shared secret (REVALIDATE_SECRET) must match. The caller sends it
// either as ?secret=... or an `x-revalidate-secret` header. Without a configured
// secret the route refuses to run, so it can't be abused as an open cache-buster.
//
// Contract (POST JSON, all fields optional — send what changed):
//   { "type": "product",  "slug": "skardu-shilajit" }
//   { "type": "blog",     "slug": "benefits-of-shilajit" }
//   { "type": "category", "slug": "almonds" }
//   { "paths": ["/products", "/"] }          // explicit path list
//   { "tags":  ["products"] }                // if you adopt fetch tags later
//
// It always also revalidates the listing pages that embed the changed entity
// (e.g. a product change refreshes "/products", the product's category page,
// the home page and the sitemap) so lists stay consistent with detail pages.

import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// This route must never be statically optimized.
export const dynamic = 'force-dynamic';

function getSecret(req, body) {
  const url = new URL(req.url);
  return (
    url.searchParams.get('secret') ||
    req.headers.get('x-revalidate-secret') ||
    body?.secret ||
    null
  );
}

export async function POST(req) {
  const expected = process.env.REVALIDATE_SECRET;

  // Fail closed: no secret configured => feature disabled.
  if (!expected) {
    return NextResponse.json(
      { revalidated: false, error: 'Revalidation is not configured on the server.' },
      { status: 501 }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional for some callers; keep an empty object.
  }

  const provided = getSecret(req, body);
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { revalidated: false, error: 'Invalid or missing secret.' },
      { status: 401 }
    );
  }

  const revalidated = { paths: [], tags: [] };

  const addPath = (p) => {
    if (typeof p === 'string' && p.startsWith('/') && !revalidated.paths.includes(p)) {
      revalidatePath(p);
      revalidated.paths.push(p);
    }
  };
  const addTag = (t) => {
    if (typeof t === 'string' && t && !revalidated.tags.includes(t)) {
      revalidateTag(t);
      revalidated.tags.push(t);
    }
  };

  const { type, slug, categorySlug, paths, tags } = body;

  // Entity-aware revalidation: refresh the detail page AND the lists it appears in.
  switch (type) {
    case 'product': {
      if (slug) addPath(`/product/${slug}`);
      addPath('/products');
      if (categorySlug) addPath(`/products/${categorySlug}`);
      addPath('/');          // home embeds product carousels
      addPath('/sitemap.xml');
      break;
    }
    case 'category': {
      if (slug) addPath(`/products/${slug}`);
      addPath('/products');
      addPath('/sitemap.xml');
      break;
    }
    case 'blog': {
      if (slug) addPath(`/blog/${slug}`);
      addPath('/blog');
      addPath('/');          // home embeds a blog section
      addPath('/sitemap.xml');
      break;
    }
    default:
      // No known type — rely on explicit paths/tags below.
      break;
  }

  // Explicit overrides / additions from the caller.
  if (Array.isArray(paths)) paths.forEach(addPath);
  if (Array.isArray(tags)) tags.forEach(addTag);

  if (revalidated.paths.length === 0 && revalidated.tags.length === 0) {
    return NextResponse.json(
      {
        revalidated: false,
        error: 'Nothing to revalidate. Provide a known `type` (+slug) or explicit `paths`/`tags`.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    ...revalidated,
  });
}

// Optional GET for quick health/config checks (does not reveal the secret).
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.REVALIDATE_SECRET),
    usage: 'POST JSON { type: "product"|"blog"|"category", slug, categorySlug } with the shared secret.',
  });
}
