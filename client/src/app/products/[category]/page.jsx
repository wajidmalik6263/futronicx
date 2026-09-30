// Category listing — visible page is the original Products view filtered by
// category (via AppShell), matching the live design. Server page adds per-
// category metadata + canonical.
//
// SSG + ISR: known categories are pre-rendered at build time
// (generateStaticParams) and regenerated in the background hourly, matching the
// /products listing. All categories share one route with no per-category
// stock-velocity distinction, so a single hourly window applies uniformly.
// Filtering/sorting is client-side in AppShell against live data, so the
// visible design is unchanged — ISR only governs the static HTML shell.
import { getCategories } from '../../../lib/server-api';
import { SITE_ORIGIN } from '../../../lib/site';
import AppShell from '../../../components/ssr/AppShell';

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategories(3600);
  return categories.map((c) => ({ category: String(c.slug) }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categories = await getCategories(3600);
  const cat = categories.find((c) => c.slug === category);
  const name = cat ? cat.name : 'Products';
  return {
    title: `${name} — Buy Fresh Online | North Dry Fruits`,
    description: `Shop premium ${name.toLowerCase()} sourced directly from Gilgit-Baltistan. 100% organic, freshly packed and delivered across Pakistan.`,
    alternates: { canonical: `${SITE_ORIGIN}/products/${category}` },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const categories = await getCategories(3600);
  const cat = categories.find((c) => c.slug === category);
  const name = cat ? cat.name : 'Products';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_ORIGIN}/products` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_ORIGIN}/products/${category}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
