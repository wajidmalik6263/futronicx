// About — the VISIBLE page is the original About view (via AppShell), so the
// design is identical to the live site. This server page adds metadata +
// BreadcrumbList JSON-LD for indexing. Pure SSG (static, rebuild on edit only).
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

// Static content — prerendered at build time, no revalidation.
export const dynamic = 'force-static';

export async function generateMetadata() {
  return {
    title: 'Pure Organic Heritage from Skardu | About North Dry Fruits',
    description:
      'Learn how we bring 100% fresh, hand-picked organic dry fruits and Shilajit straight from the pristine Gilgit-Baltistan mountains to you.',
    alternates: { canonical: `${SITE_ORIGIN}/about` },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
    { '@type': 'ListItem', position: 2, name: 'About Us', item: `${SITE_ORIGIN}/about` },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
