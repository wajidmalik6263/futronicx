// Guides — visible page is the original GuidesPage view (via AppShell). Server
// page adds metadata + canonical. ISR hourly.
import { SITE_ORIGIN } from '../../lib/site';
import AppShell from '../../components/ssr/AppShell';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Guides & Resources | North Dry Fruits',
    description:
      'Guides, recipes and resources on organic dry fruits and nuts from Gilgit-Baltistan — how to choose, store and enjoy them, plus regional sourcing pages.',
    alternates: { canonical: `${SITE_ORIGIN}/guides` },
  };
}

export default function GuidesPage() {
  return <AppShell />;
}
