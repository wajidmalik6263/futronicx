// Product detail — SSG + ISR. The VISIBLE page is the original ProductDetail
// view (rendered via AppShell), so the design is pixel-identical to the live
// site. This server page adds per-page metadata + Product/Breadcrumb JSON-LD in
// the initial HTML for Google indexing.
//
// Rendering strategy: known product slugs are pre-rendered at build time
// (generateStaticParams) and regenerated in the background on a short window
// (5 min). New products (added after build) are rendered on-demand on first
// request then cached (dynamicParams defaults to true). This makes the
// highest-traffic, most-crawled page type cheap to serve while keeping
// stock/price fresh to within the window. Admin edits also trigger instant
// on-demand revalidation via /api/revalidate, so the timer is just a safety
// net. Live stock is re-validated at add-to-cart (GET /api/products/:id/stock),
// so a cached page can never cause overselling.
import { notFound } from 'next/navigation';
import { getProductBySlug, getSettings, getProducts } from '../../../lib/server-api';
import { SITE_ORIGIN } from '../../../lib/site';
import AppShell from '../../../components/ssr/AppShell';

// Regenerate a product page at most every 5 minutes in the background.
export const revalidate = 300;

// Pre-render known product slugs at build time; unknown/new slugs render
// on-demand (dynamicParams is true by default) and are then cached.
export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 1000 }, 300);
  return (products || [])
    .filter((p) => p.slug)
    .map((p) => ({ slug: String(p.slug) }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: 'Product Not Found', robots: { index: false } };
  }
  const description = product.description
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Buy ${product.name} — fresh organic products from Gilgit-Baltistan.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `${SITE_ORIGIN}/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.image_url ? [product.image_url] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
  ]);

  if (!product) notFound();

  const currencyCode = settings.currency_code || 'PKR';
  const brandName = settings.store_name || 'North Dry Fruits';
  const productUrl = `${SITE_ORIGIN}/product/${product.slug}`;
  const skuPrefix = settings.sku_prefix || 'NDF';
  const returnDays = Number(settings.return_window_days) || 7;

  const optionPrices = (product.weight_options || [])
    .map((o) => Number(o.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const lowPrice = optionPrices.length ? Math.min(...optionPrices) : Number(product.base_price) || 0;
  const highPrice = optionPrices.length ? Math.max(...optionPrices) : Number(product.base_price) || 0;
  const availability = product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const productDescription = product.description
    ? product.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)
    : `Buy ${product.name}`;

  // Price validity: 90 days from now (avoids Google "stale price" warnings).
  const priceValidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: currencyCode },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 3, unitCode: 'DAY' },
    },
  };

  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'PK',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: returnDays,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };

  const offers =
    optionPrices.length > 1 && lowPrice !== highPrice
      ? { '@type': 'AggregateOffer', offerCount: optionPrices.length, lowPrice, highPrice, priceCurrency: currencyCode, availability, url: productUrl, priceValidUntil, shippingDetails, hasMerchantReturnPolicy: returnPolicy }
      : { '@type': 'Offer', price: lowPrice, priceCurrency: currencyCode, availability, url: productUrl, priceValidUntil, shippingDetails, hasMerchantReturnPolicy: returnPolicy, itemCondition: 'https://schema.org/NewCondition' };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        description: productDescription,
        image: product.image_url || `${SITE_ORIGIN}/placeholder.png`,
        sku: `${skuPrefix}-${product.id}`,
        brand: { '@type': 'Brand', name: brandName },
        ...(product.category_name ? { category: product.category_name } : {}),
        offers,
        ...(product.review_count > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.review_count } }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_ORIGIN}/products` },
          ...(product.category_name
            ? [{ '@type': 'ListItem', position: 3, name: product.category_name, item: `${SITE_ORIGIN}/products/${product.category_slug}` }]
            : []),
          { '@type': 'ListItem', position: product.category_name ? 4 : 3, name: product.name, item: productUrl },
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
