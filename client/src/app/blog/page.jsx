// Blog listing — visible page is the original Blog view (via AppShell). Server
// page adds metadata + canonical. ISR hourly.
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Blog — Guides, Recipes & Health Tips | North Dry Fruits',
    description:
      'Read our guides on organic dry fruits, nuts and natural wellness — recipes, storage tips, and the health benefits of Gilgit-Baltistan superfoods.',
    alternates: { canonical: `${SITE_ORIGIN}/blog` },
  };
}

export default function BlogListPage() {
  return <AppShell />;
}
