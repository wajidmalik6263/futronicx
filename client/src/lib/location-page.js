// Shared builder for the region landing pages (/dry-fruits-*). Each region page
// file is a thin wrapper that calls these with its slug so the SSR logic +
// metadata live in one place. Products are matched to the region by their
// `origin` field against the region's originMatch terms (mirrors the SPA
// LocationPage + server prerender behaviour).
import { getLocationSeo } from '../utils/locationSeo';
import { SITE_ORIGIN } from './site';

// NOTE: each region page declares its own `export const revalidate = 86400`
// (Next requires route segment configs to be static literals in the page file).

export function buildLocationMetadata(slug) {
  const loc = getLocationSeo(slug);
  if (!loc) return { title: 'Not Found', robots: { index: false } };
  return {
    title: loc.title,
    description: loc.description,
    alternates: { canonical: `${SITE_ORIGIN}/${slug}` },
    openGraph: { title: loc.title, description: loc.description, type: 'website' },
  };
}

// Region JSON-LD (Breadcrumb + FAQPage) for the initial HTML. The visible page
// is the original LocationPage view (rendered via AppShell) so the design
// matches the live site.
export function buildLocationStructuredData(slug) {
  const loc = getLocationSeo(slug);
  if (!loc) return null;
  const url = `${SITE_ORIGIN}/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: loc.h1, item: url },
        ],
      },
      ...(loc.faqs?.length
        ? [{
            '@type': 'FAQPage',
            mainEntity: loc.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };
}
