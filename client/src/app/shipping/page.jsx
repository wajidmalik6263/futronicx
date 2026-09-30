// Shipping — visible page is the original ShippingPage view (via AppShell).
// Server page adds metadata + BreadcrumbList JSON-LD. ISR daily.
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

export const revalidate = 86400;

export async function generateMetadata() {
  return {
    title: 'Shipping & Delivery | North Dry Fruits',
    description:
      'Nationwide delivery across Pakistan with free shipping on all orders. Dispatch within 24 hours, arrival in 2–3 business days, and easy order tracking.',
    alternates: { canonical: `${SITE_ORIGIN}/shipping` },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Shipping & Delivery', item: `${SITE_ORIGIN}/shipping` },
  ],
};

export default function ShippingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
