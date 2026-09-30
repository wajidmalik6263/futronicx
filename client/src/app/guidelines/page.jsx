// Guidelines — visible page is the original GuidelinesPage view (via AppShell).
// Server page adds metadata + BreadcrumbList JSON-LD. Pure SSG (static).
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

// Static content — prerendered at build time, no revalidation.
export const dynamic = 'force-static';

export async function generateMetadata() {
  return {
    title: 'How to Choose & Store Dry Fruits — Buyer Guidelines | North Dry Fruits',
    description:
      'A practical guide to choosing, storing and ordering premium dry fruits and nuts — walnuts, apricots, almonds, mulberries, pine nuts, raisins, dates and pistachios.',
    alternates: { canonical: `${SITE_ORIGIN}/guidelines` },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Guidelines', item: `${SITE_ORIGIN}/guidelines` },
  ],
};

export default function GuidelinesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
