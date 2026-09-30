// Home ("/") — the VISIBLE page is the original Home view (hero slider,
// category showcase, product sections, reviews, blog) rendered via AppShell, so
// it is pixel-identical to the live site. This server page adds metadata +
// Organization/WebSite/FAQPage JSON-LD in the initial HTML for indexing.
// SSG + ISR: prerendered as static HTML, then regenerated in the background
// on a schedule so the embedded product/blog lists stay reasonably fresh
// without paying for per-request rendering on this high-traffic route.
import { getSettings } from '../lib/server-api';
import { SITE_ORIGIN } from '../lib/site';
import AppShell from '../components/ssr/AppShell';

// Revalidate the static home page hourly (background regeneration). New
// products/blog posts surface within the window without a full rebuild.
export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits',
    description:
      'Shop 100% pure, natural dry fruits, herbal teas, and Skardu Shilajit directly from Gilgit-Baltistan. Order online for fast home delivery!',
    alternates: { canonical: `${SITE_ORIGIN}/` },
  };
}

export default async function HomePage() {
  // Matches the page revalidate window (ISR): settings baked into the static
  // HTML refresh in the background every hour.
  const settings = await getSettings(3600);
  const storeName = settings.store_name || 'North Dry Fruits';
  const returnDays = Number(settings.return_window_days) || 7;

  const homeFaqs = [
    { q: 'Where do your dry fruits and nuts come from?', a: 'Our products are sourced from Gilgit-Baltistan and the northern regions of Pakistan, then delivered fresh across the country.' },
    { q: 'Do you deliver nationwide, and how long does it take?', a: 'Yes, we deliver nationwide across Pakistan. Orders are dispatched within 24 hours and typically arrive within 2–3 business days.' },
    { q: 'How much does shipping cost?', a: 'Shipping is completely free on all orders across Pakistan — there are no delivery charges.' },
    { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), Easypaisa, JazzCash and bank transfer. Online payments are verified by our team within a few hours.' },
    { q: 'What is your return policy?', a: `We offer a ${returnDays}-day return window. If you're not satisfied with your order, contact us within that period to arrange a return.` },
    { q: 'How can I track my order?', a: 'Use the Track Order page and enter your Order ID and phone number to see the latest status of your order.' },
  ];

  const sameAs = [
    settings.social_facebook, settings.social_instagram, settings.social_twitter,
    settings.social_youtube, settings.social_linkedin,
  ].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: storeName,
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/icons.svg`,
        ...(settings.store_tagline ? { description: settings.store_tagline } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(settings.contact_address
          ? { address: { '@type': 'PostalAddress', streetAddress: settings.contact_address, addressCountry: settings.country_code || 'PK' } }
          : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: storeName,
        url: `${SITE_ORIGIN}/`,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_ORIGIN}/products?search={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_ORIGIN}/#faq`,
        mainEntity: homeFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
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
