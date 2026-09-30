// Blog detail (or blog-category listing) — visible page is the original
// BlogSlugRouter/BlogDetail view (via AppShell), so the design matches the live
// site. Server page adds per-article metadata + BlogPosting JSON-LD. ISR hourly.
import { getBlogBySlug, getSettings } from '../../../lib/server-api';
import { SITE_ORIGIN } from '../../../lib/site';
import AppShell from '../../../components/ssr/AppShell';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (blog) {
    return {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || '',
      alternates: { canonical: `${SITE_ORIGIN}/blog/${blog.slug}` },
      openGraph: {
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt || '',
        images: blog.image ? [blog.image] : undefined,
        type: 'article',
      },
    };
  }
  return {
    title: 'Blog | North Dry Fruits',
    alternates: { canonical: `${SITE_ORIGIN}/blog/${slug}` },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const [blog, settings] = await Promise.all([
    getBlogBySlug(slug),
    getSettings(3600),
  ]);

  const structuredData = blog
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: blog.metaDescription || blog.excerpt || '',
        image: blog.image ? [blog.image] : undefined,
        datePublished: blog.publishedAt || blog.createdAt,
        dateModified: blog.updatedAt || blog.createdAt,
        author: { '@type': 'Person', name: blog.author || 'Admin' },
        publisher: {
          '@type': 'Organization',
          name: settings.store_name || 'North Dry Fruits',
          logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/icons.svg` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_ORIGIN}/blog/${blog.slug}` },
      }
    : null;

  return (
    <>
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      <AppShell />
    </>
  );
}
