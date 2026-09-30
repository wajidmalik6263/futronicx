// Next.js App Router custom 404 page. Rendered when notFound() is called from
// any server component (product/blog detail pages) or when no route matches.
// Returns a real HTTP 404 status so crawlers get an honest signal instead of a
// soft-404 (200 + "not found" content) which Google penalises.
import Link from 'next/link';
import { SITE_ORIGIN } from '../lib/site';

export const metadata = {
    title: 'Page Not Found | North Dry Fruits',
    description: 'The page you are looking for does not exist or has been moved.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_ORIGIN}/` },
};

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#3A2E1F',
                padding: '2rem',
                textAlign: 'center',
            }}
        >
            <h1 style={{ fontSize: '6rem', fontWeight: 800, margin: 0, color: '#F5A623' }}>
                404
            </h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.5rem' }}>
                Page Not Found
            </h2>
            <p style={{ maxWidth: 480, marginTop: '1rem', lineHeight: 1.6, color: '#6B5B4B' }}>
                Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
                Try browsing our products or head back to the homepage.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        backgroundColor: '#F5A623',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                >
                    Go Home
                </Link>
                <Link
                    href="/products"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        border: '2px solid #F5A623',
                        color: '#F5A623',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                >
                    Browse Products
                </Link>
            </div>
        </div>
    );
}
