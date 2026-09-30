// Shared server view for /products and /products/[category]. Renders the
// heading, category chips (as links) and a server-rendered product grid — all
// real HTML, visible with JS disabled. Interactive per-card controls come from
// the ProductCardServer -> ProductCardActions island.
import Link from 'next/link';
import ProductCardServer from '../../components/ssr/ProductCardServer';
import SiteChrome from '../../components/ssr/SiteChrome';

export default function ProductsView({ settings, categories, products, activeCategory }) {
  const currencySymbol = settings.currency_symbol || '$';
  const activeCat =
    activeCategory && categories.find((c) => c.slug === activeCategory);
  const heading = activeCat ? activeCat.name : (settings.store_name || 'All Products');

  return (
    <SiteChrome settings={settings}>
      <div className="pb-16 w-full px-4 sm:px-8 lg:px-16 pt-6">
        <section className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
            {activeCat ? `${activeCat.name}` : 'Our Products'}
          </h1>
          <p className="text-sm text-[#5C4A32] mt-1 max-w-2xl">
            {activeCat
              ? `Browse our range of ${activeCat.name.toLowerCase()} — fresh from Gilgit-Baltistan.`
              : 'Premium organic dry fruits, nuts and natural products, delivered fresh across Pakistan.'}
          </p>
        </section>

        {/* Category chips */}
        <nav aria-label="Product categories" className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/products"
            className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors ${!activeCategory
              ? 'bg-[#F5A623] text-[#3A2E1F] border-[#D97706]'
              : 'bg-white text-[#3A2E1F] border-[#E8DEC8] hover:border-[#F5A623]'}`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id || cat.slug}
              href={`/products/${cat.slug}`}
              className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors ${activeCategory === cat.slug
                ? 'bg-[#F5A623] text-[#3A2E1F] border-[#D97706]'
                : 'bg-white text-[#3A2E1F] border-[#E8DEC8] hover:border-[#F5A623]'}`}
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center text-[#5C4A32]">
            <p className="text-lg font-bold">No products found.</p>
            <p className="text-sm mt-1">Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product) => (
              <ProductCardServer
                key={product.id}
                product={product}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}
      </div>
    </SiteChrome>
  );
}
