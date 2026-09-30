import AppShell from '../../components/ssr/AppShell';
import { buildLocationMetadata, buildLocationStructuredData } from '../../lib/location-page';

const SLUG = 'dry-fruits-gilgit';
export const revalidate = 86400;
export const generateMetadata = () => buildLocationMetadata(SLUG);

export default function Page() {
  const sd = buildLocationStructuredData(SLUG);
  return (
    <>
      {sd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }} />}
      <AppShell />
    </>
  );
}
