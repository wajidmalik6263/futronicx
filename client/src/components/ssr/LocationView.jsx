// Server view for the region landing pages (/dry-fruits-*). Renders the H1,
// intro paragraphs, related products (server cards) and a visible FAQ backed by
// FAQPage JSON-LD — all crawlable HTML. Copy comes from locationSeo.js so JS and
// non-JS crawlers see identical content.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteChrome from './SiteChrome';
import ProductCardServer from './ProductCardServer';
import { SITE_ORIGIN } from '../../lib/site';

export default function LocationView({ slug, loc, settings, products }) {
  const currencySymbol = settings.currency_symbol || '$';
  const url = `${SITE_ORIGIN}/${slug}`;

  const structuredData = {
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

  return (
    <SiteChrome settings={settings}>
      <div className="pb-16 max-w-[1100px] mx-auto px-4 sm:px-6 pt-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[#3A2E1F]/70 mb-6">
          <Link href="/" className="hover:text-[#B45309]">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#3A2E1F] font-medium">{loc.region}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F] mb-5">
          {loc.h1}
        </h1>

        <div className="space-y-4 text-[#3A2E1F]/85 leading-relaxed max-w-3xl">
          {loc.intro.map((para, i) => (
            <p key={i} className="text-sm sm:text-base">{para}</p>
          ))}
        </div>

        {products && products.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-5">
              Products from {loc.region}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCardServer key={product.id} product={product} currencySymbol={currencySymbol} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full transition-all"
          >
            <span>Shop All Dry Fruits</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loc.faqs?.length > 0 && (
          <section className="mt-14 space-y-4">
            <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 gap-3">
              {loc.faqs.map((f, i) => (
                <details key={i} className="group border border-[#E8DEC8] rounded-2xl bg-[#FFFDF9] overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-4 text-sm sm:text-base font-bold text-[#3A2E1F] font-body list-none">
                    <span>{f.q}</span>
                    <span className="text-[#D97706] text-2xl leading-none shrink-0 group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[#3A2E1F]/75 leading-relaxed font-body">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteChrome>
  );
}
