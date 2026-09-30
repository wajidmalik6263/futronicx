// Next.js sitemap route -> serves /sitemap.xml from the Next server.
// Mirrors server/routes/sitemap.js: static pages + region landing pages +
// product category listings + individual products + blog categories + blog
// posts. Data is fetched from the API through the server data layer, so the
// sitemap stays in sync with live content. Revalidated hourly.
import { getProducts, getCategories, getBlogs, getBlogCategories } from '../lib/server-api';
import { LOCATION_SEO } from '../utils/locationSeo';
import { SITE_ORIGIN } from '../lib/site';

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();

  // Static, evergreen pages.
  const staticPages = [
    { url: '/', changeFrequency: 'daily', priority: 1.0 },
    { url: '/products', changeFrequency: 'daily', priority: 0.9 },
    { url: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/faq', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/shipping', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/guides', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/guidelines', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
  ].map((p) => ({
    url: `${SITE_ORIGIN}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Region landing pages (kept in sync with LOCATION_SEO).
  const regionPages = Object.keys(LOCATION_SEO).map((slug) => ({
    url: `${SITE_ORIGIN}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic content — fail-open to empty lists if the API is unreachable.
  const [{ products }, categories, { blogs }, blogCats] = await Promise.all([
    getProducts({ limit: 1000 }, 3600),
    getCategories(3600),
    getBlogs({ limit: 1000 }, 3600),
    getBlogCategories(3600),
  ]);

  const categoryPages = (categories || [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_ORIGIN}/products/${c.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  const productPages = (products || [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_ORIGIN}/product/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const blogCategoryPages = ((blogCats && blogCats.data) || [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_ORIGIN}/blog/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  const blogPages = (blogs || [])
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${SITE_ORIGIN}/blog/${b.slug}`,
      lastModified: b.updatedAt || b.createdAt ? new Date(b.updatedAt || b.createdAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [
    ...staticPages,
    ...regionPages,
    ...categoryPages,
    ...productPages,
    ...blogCategoryPages,
    ...blogPages,
  ];
}
