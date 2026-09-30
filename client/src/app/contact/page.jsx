// Contact — visible page is the original Contact view (via AppShell). Server
// page adds metadata + BreadcrumbList JSON-LD. Pure SSG (static).
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

// Static content — prerendered at build time, no revalidation.
export const dynamic = 'force-static';

export async function generateMetadata() {
  return {
    title: 'Contact Us – Customer Care Support | North Dry Fruits',
    description:
      "Have questions about your order or our organic products? Reach out to our friendly support team today. We're always here to assist you!",
    alternates: { canonical: `${SITE_ORIGIN}/contact` },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Contact Us', item: `${SITE_ORIGIN}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
