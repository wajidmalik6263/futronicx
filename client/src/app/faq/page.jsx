// FAQ — visible page is the original FaqPage view (via AppShell). Server page
// adds metadata + FAQPage/Breadcrumb JSON-LD (settings-driven). ISR daily.
import { getSettings } from '../../lib/server-api';
import { getFaqs } from '../../utils/infoPages';
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

export const revalidate = 86400;

export async function generateMetadata() {
  return {
    title: 'Frequently Asked Questions | North Dry Fruits',
    description:
      'Answers to common questions about ordering, sourcing, shipping, payment, returns and tracking at North Dry Fruits.',
    alternates: { canonical: `${SITE_ORIGIN}/faq` },
  };
}

export default async function FaqPage() {
  const settings = await getSettings();
  const faqs = getFaqs(settings || {});
  const canonical = `${SITE_ORIGIN}/faq`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'FAQ', item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AppShell />
    </>
  );
}
