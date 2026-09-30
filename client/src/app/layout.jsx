import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_ORIGIN } from '../lib/site';

// Optional Google Search Console verification token (set NEXT_PUBLIC_GSC_VERIFICATION).
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

// Migrated from the old Vite index.html <head>. Next's Metadata API renders
// these tags server-side so non-JS crawlers get the same rich preview the
// static HTML previously provided. react-helmet-async (in SEO.jsx) still
// overrides title/description/canonical per-route once the app hydrates.
export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: 'Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits',
  description:
    'Shop 100% pure, natural dry fruits, herbal teas, and Skardu Shilajit directly from Gilgit-Baltistan. Order online for fast home delivery!',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  ...(GSC_VERIFICATION
    ? { verification: { google: GSC_VERIFICATION } }
    : {}),
  openGraph: {
    siteName: 'North Dry Fruits',
    locale: 'en_US',
    type: 'website',
    title: 'Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits',
    description:
      'Shop 100% pure, natural dry fruits, herbal teas, and Skardu Shilajit directly from Gilgit-Baltistan. Order online for fast home delivery!',
    url: `${SITE_ORIGIN}/`,
    images: [
      {
        url: `${SITE_ORIGIN}/placeholder.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Fresh Organic Dry Fruits & Shilajit | North Dry Fruits',
    description:
      'Shop 100% pure, natural dry fruits, herbal teas, and Skardu Shilajit directly from Gilgit-Baltistan. Order online for fast home delivery!',
    images: [`${SITE_ORIGIN}/placeholder.png`],
  },
};

export const viewport = {
  themeColor: '#F5A623',
  width: 'device-width',
  initialScale: 1,
};

// Static WebSite + Organization structured data with merchant policies.
// Uses SITE_ORIGIN so it works across dev/prod deployments.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: 'North Dry Fruits',
      url: `${SITE_ORIGIN}/`,
      logo: `${SITE_ORIGIN}/icons.svg`,
      // Merchant return policy — surfaces in Google Shopping & AI shopping agents.
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        '@id': `${SITE_ORIGIN}/#return-policy`,
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: 'North Dry Fruits',
      url: `${SITE_ORIGIN}/`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate:
            `${SITE_ORIGIN}/products?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Warm up the image CDN early for the LCP hero image. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Google Fonts (Inter + Plus Jakarta Sans). The hero <h1> is the LCP
            element and renders in Inter, so the font CSS is loaded on the
            critical path (not deferred) and both origins are preconnected —
            this keeps the preconnects "used" and gets the LCP text its font
            sooner. `display=swap` avoids blocking paint on the font file. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@600;700&display=swap"
          rel="stylesheet"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-gbmarket-cream text-gbmarket-dark font-body antialiased selection:bg-gbmarket-gold/30"
      >
        {/* #root preserved so existing CSS (#root { flex column; min-height })
            and the SPA shell continue to behave exactly as before. */}
        <div id="root" suppressHydrationWarning>{children}</div>
        <noscript>
          <div
            style={{
              maxWidth: 640,
              margin: '48px auto',
              padding: 24,
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
              color: '#3A2E1F',
            }}
          >
            <h1>North Dry Fruits</h1>
            <p>
              Premium dry fruits, nuts and natural products from
              Gilgit-Baltistan, Pakistan, delivered fresh to your door.
            </p>
            <p>
              This store needs JavaScript enabled to shop. Please enable
              JavaScript, or contact us to place an order.
            </p>
            <p>
              <a href="/products">Browse products</a> &middot;{' '}
              <a href="/about">About us</a> &middot; <a href="/contact">Contact</a>
            </p>
          </div>
        </noscript>
      </body>
      {/* Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is set.
          @next/third-parties loads gtag.js after hydration so it never blocks
          first paint. */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
