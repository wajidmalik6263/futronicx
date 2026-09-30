// Privacy — visible page is the original PrivacyPolicy view (via AppShell).
// Server page adds metadata + BreadcrumbList JSON-LD. Pure SSG (static).
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

// Static content — prerendered at build time, no revalidation.
export const dynamic = 'force-static';

export async function generateMetadata() {
  return {
    title: 'Privacy Policy | North Dry Fruits',
    description:
      'How North Dry Fruits collects, uses and protects your personal data when you shop with us.',
    alternates: { canonical: `${SITE_ORIGIN}/privacy` },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${SITE_ORIGIN}/privacy` },
  ],
};

export default function PrivacyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
