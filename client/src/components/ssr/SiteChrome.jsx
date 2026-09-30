// SiteChrome — thin wrapper kept for backwards compatibility. All SSR pages
// import SiteChrome; it now delegates to RealChrome, which mounts the ACTUAL
// site Header and Footer components (client-side) so every page is
// pixel-identical to the live site. The `settings` prop is accepted but no
// longer used (RealChrome's providers fetch live settings themselves).
import RealChrome from './RealChrome';

export default function SiteChrome({ children, isHome = false }) {
  return <RealChrome isHome={isHome}>{children}</RealChrome>;
}
