// Products listing — visible page is the original Products view (via AppShell),
// so the full filter/search/sort/grid design matches the live site. Server page
// adds metadata + canonical.
//
// SSG + ISR: the listing is prerendered as static HTML and regenerated in the
// background hourly, so newly added products surface without a full rebuild and
// without per-request rendering. Filters/search/sort run client-side in
// AppShell against live API data, so the visible design and behaviour are
// unchanged — ISR only governs the static HTML shell + metadata.
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Shop Premium Organic Dry Fruits & Nuts | North Dry Fruits',
    description:
      'Browse our full range of 100% organic dry fruits, nuts, herbal teas and Skardu Shilajit — sourced directly from Gilgit-Baltistan and delivered fresh.',
    alternates: { canonical: `${SITE_ORIGIN}/products` },
  };
}

export default function ProductsPage() {
  return <AppShell />;
}
