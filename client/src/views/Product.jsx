import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, RotateCcw, PackageX, X, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../hooks/useCurrency';
import SEO from '../components/SEO';
import NotFound from './NotFound';
import { getCategorySeo } from '../utils/categorySeo';
import { optimizeImage } from '../utils/imageUrl';

export default function Products() {
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    // The category now comes from the URL path (/products/:category) rather than
    // the query string. 'all' represents the base /products page.
    const { category: routeCategory } = useParams();
    const selectedCategory = routeCategory || 'all';
    const initialSearch = searchParams.get('search') || '';

    // Legacy query-param support: /products?category=x should map to /products/x.
    // We redirect on the client so any old bookmarks/links still land correctly.
    const legacyCategory = searchParams.get('category');

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCats, setLoadingCats] = useState(true);

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState(15000);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Infinite scroll state
    const ITEMS_PER_PAGE = 9;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [loadingMore, setLoadingMore] = useState(false);
    const loaderRef = useRef(null);

    // Prevent background scrolling when mobile filter drawer is open
    useEffect(() => {
        if (isMobileFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileFilterOpen]);

    // Debounce search query syncing to URL (search stays a query param; the
    // category is part of the path so we never write it here anymore).
    useEffect(() => {
        const handler = setTimeout(() => {
            const newParams = { ...Object.fromEntries(searchParams.entries()) };
            // Never keep a legacy ?category= param around; the path owns category.
            delete newParams.category;
            if (searchQuery.trim()) {
                newParams.search = searchQuery;
            } else {
                delete newParams.search;
            }
            setSearchParams(newParams, { replace: true });
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery, setSearchParams]);

    // Fetch Categories on mount
    useEffect(() => {
        getCategories().then(cats => {
            setCategories(cats);
            setLoadingCats(false);
        }).catch(console.error);
    }, []);

    // Fetch Products when the category or search changes
    useEffect(() => {
        const fetchProductsData = async () => {
            setLoading(true);
            try {
                const search = searchParams.get('search');

                const params = {};
                if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
                if (search) params.search = search;

                const data = await getProducts(params);
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductsData();
    }, [selectedCategory, searchParams]);

    // Client-side Price & Sort filtering
    const filteredProducts = useMemo(() => {
        let result = products.filter(p => p.base_price <= priceRange);

        // Client-side search filtering to ensure only matching products show
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.category_name?.toLowerCase().includes(query) ||
                p.category_slug?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }

        const sorted = result.sort((a, b) => {
            if (sortBy === 'low-high') return a.base_price - b.base_price;
            if (sortBy === 'high-low') return b.base_price - a.base_price;
            return b.id - a.id;
        });

        // When browsing "All Categories" with the default "newest" sort, products
        // tend to cluster by category (items in a category share sequential IDs),
        // so the first rows show all Walnuts, then all Raisins, etc. Interleave
        // them round-robin by category so the top rows show a variety of
        // categories. We keep the newest-first order within each category.
        if (selectedCategory === 'all' && sortBy === 'newest') {
            const buckets = new Map();
            for (const p of sorted) {
                const key = p.category_slug || p.category_name || 'uncategorized';
                if (!buckets.has(key)) buckets.set(key, []);
                buckets.get(key).push(p);
            }
            const lists = Array.from(buckets.values());
            const interleaved = [];
            let added = true;
            for (let i = 0; added; i++) {
                added = false;
                for (const list of lists) {
                    if (i < list.length) {
                        interleaved.push(list[i]);
                        added = true;
                    }
                }
            }
            return interleaved;
        }

        return sorted;
    }, [products, priceRange, sortBy, searchQuery, selectedCategory]);

    // Reset visible count when filters/products change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [filteredProducts.length, selectedCategory, searchQuery, priceRange, sortBy]);

    // Products currently visible on screen
    const visibleProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;

    // Infinite scroll using IntersectionObserver
    useEffect(() => {
        if (!hasMore || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setLoadingMore(true);
                    // Small delay to show loading indicator
                    setTimeout(() => {
                        setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length));
                        setLoadingMore(false);
                    }, 400);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, loading, filteredProducts.length, visibleCount]);

    const handleCategoryChange = (slug) => {
        // Category lives in the path now. Preserve an active search term.
        const search = searchQuery.trim();
        const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
        if (slug === 'all') {
            navigate(`/products${suffix}`);
        } else {
            navigate(`/products/${slug}${suffix}`);
        }
        setIsMobileFilterOpen(false);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setPriceRange(15000);
        setSortBy('newest');
        navigate('/products');
    };

    // ------------------------------------------------------------------
    // Legacy redirect: /products?category=x  ->  /products/x
    // Handled on the client for any old links that still carry the query
    // param. (A server-side 301 also exists for SEO — see server.js.)
    // ------------------------------------------------------------------
    if (legacyCategory) {
        const rest = new URLSearchParams(searchParams);
        rest.delete('category');
        const suffix = rest.toString() ? `?${rest.toString()}` : '';
        const target = legacyCategory === 'all'
            ? `/products${suffix}`
            : `/products/${legacyCategory}${suffix}`;
        return <Navigate to={target} replace />;
    }

    // ------------------------------------------------------------------
    // Derive the active category + SEO once categories have loaded.
    // ------------------------------------------------------------------
    const isCategoryView = selectedCategory !== 'all';
    const activeCategory = isCategoryView
        ? categories.find((c) => c.slug === selectedCategory)
        : null;

    // Invalid category slug (categories loaded, none matched) -> render 404.
    if (isCategoryView && !loadingCats && !activeCategory) {
        return <NotFound />;
    }

    const origin = settings.site_url
        ? settings.site_url.replace(/\/$/, '')
        : window.location.origin;

    const catSeo = isCategoryView
        ? getCategorySeo(selectedCategory, activeCategory?.name)
        : null;

    const storeName = settings.store_name || 'North Dry Fruits';
    // Titles are passed as rawTitle (no automatic " | store" suffix) so they
    // match the server-side prerender output exactly. Category titles come from
    // the shared getCategorySeo copy; the base listing mirrors the server's
    // "All Products | {store}" format.
    const pageTitle = isCategoryView
        ? catSeo.title
        : 'Shop Premium Organic Dry Fruits & Nuts | North Dry Fruits';
    const pageDescription = isCategoryView
        ? catSeo.description
        : 'Explore our collection of premium organic walnuts, almonds, Shilajit, and dried fruits. Pure, fresh, and delivered straight to your door!';
    const pageHeading = isCategoryView ? catSeo.h1 : 'Our Products';
    const canonicalUrl = isCategoryView
        ? `${origin}/products/${selectedCategory}`
        : `${origin}/products`;

    const breadcrumbItems = [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": origin },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${origin}/products` },
    ];
    if (isCategoryView) {
        breadcrumbItems.push({
            "@type": "ListItem",
            "position": 3,
            "name": activeCategory?.name || catSeo.h1,
            "item": canonicalUrl,
        });
    }

    // ------------------------------------------------------------------
    // Structured data.
    //   - Breadcrumb on every listing view (matches the server prerender).
    //   - On a category view we also emit a CollectionPage + ItemList of the
    //     products currently shown so Google understands this as a product
    //     listing page. The ItemList is built from the loaded products.
    // ------------------------------------------------------------------
    const structuredData = (() => {
        const graph = [
            {
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbItems,
            },
        ];

        if (isCategoryView && !loading && filteredProducts.length > 0) {
            graph.push({
                "@type": "CollectionPage",
                "name": catSeo.h1,
                "description": catSeo.description,
                "url": canonicalUrl,
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": filteredProducts.length,
                    "itemListElement": filteredProducts.slice(0, 30).map((p, i) => ({
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": p.name,
                        "url": `${origin}/product/${p.slug}`,
                        ...(p.image_url && /^https?:\/\//i.test(p.image_url) ? { "image": p.image_url } : {}),
                    })),
                },
            });
        }

        return {
            "@context": "https://schema.org",
            "@graph": graph,
        };
    })();

    return (
        <div className="pb-16">
            <SEO
                rawTitle={pageTitle}
                description={pageDescription}
                canonical={canonicalUrl}
                structuredData={structuredData}
            />

            {/* Header Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                            {pageHeading}
                        </h1>
                        <p className="text-sm text-[#3A2E1F]/80 mt-1">
                            {isCategoryView
                                ? `Browse our premium range of ${(activeCategory?.name || pageHeading).toLowerCase()} — sourced from the northern regions of Pakistan.`
                                : 'Discover our complete range of premium organic products from Skardu'}
                        </p>
                    </div>
                </div>
            </section>

            <section className="w-full px-4 sm:px-8 lg:px-16">
                <div className="relative lg:flex lg:gap-8">

                    {/* 2. SIDEBAR FILTER (DESKTOP) */}
                    <aside className="hidden lg:block w-[280px] shrink-0 self-start sticky top-24 h-[calc(100vh-7rem)]">
                        <div className="h-full overflow-y-auto space-y-8 bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E8DEC8 transparent' }}>
                        <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-4">
                            <h2 className="font-body font-bold text-lg text-[#3A2E1F] flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-[#D97706]" />
                                <span>Filters</span>
                            </h2>
                            <button onClick={handleResetFilters} className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5" /><span>Reset</span>
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-3">
                            <h3 className="font-body font-bold text-sm text-[#3A2E1F]">Categories</h3>
                            <div className="space-y-2 text-sm">
                                <button
                                    type="button" onClick={() => handleCategoryChange('all')}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${selectedCategory === 'all' ? 'bg-[#F5A623] text-[#3A2E1F] font-bold' : 'hover:bg-[#F5EFE0] text-[#3A2E1F]/80'
                                        }`}
                                >
                                    <span>All Categories</span>
                                </button>
                                {loadingCats && Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={`cat-skel-${i}`}
                                        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 animate-pulse"
                                    >
                                        <span className="w-6 h-6 rounded-full shrink-0 bg-[#E8DEC8]" />
                                        <span className="h-3 rounded bg-[#E8DEC8]" style={{ width: `${50 + (i % 3) * 15}%` }} />
                                    </div>
                                ))}
                                {!loadingCats && categories.map((cat) => (
                                    <button
                                        key={cat.id} type="button" onClick={() => handleCategoryChange(cat.slug)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${selectedCategory === cat.slug ? 'bg-[#F5A623] text-[#3A2E1F] font-bold' : 'hover:bg-[#F5EFE0] text-[#3A2E1F]/80'
                                            }`}
                                    >
                                        <span className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#F5EFE0] border border-[#E8DEC8] flex items-center justify-center text-xs">
                                            {cat.image_url
                                                ? <img src={optimizeImage(cat.image_url, { width: 64, height: 64, crop: 'fill' })} alt={cat.name} width="24" height="24" loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                                : cat.icon || '📦'}
                                        </span>
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Slider */}
                        <div className="space-y-3 pt-4 border-t border-[#E8DEC8]">
                            <div className="flex items-center justify-between">
                                <h3 id="price-range-label" className="font-body font-bold text-sm text-[#3A2E1F]">Max Price</h3>
                                <span className="text-xs font-bold text-[#B45309]">{formatPrice(priceRange)}</span>
                            </div>
                            <input type="range" min="500" max="15000" step="500" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} aria-labelledby="price-range-label" aria-label="Maximum price filter" className="w-full accent-[#D97706] cursor-pointer" />
                            <div className="flex justify-between text-[11px] text-[#3A2E1F]/80">
                                <span>{formatPrice(500)}</span><span>{formatPrice(15000)}</span>
                            </div>
                        </div>
                        </div>
                    </aside>

                    {/* MAIN CATALOG AREA */}
                    <main className="flex-1 min-w-0 space-y-6">

                        {/* Search & Sort Toolbar */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:flex-1">
                                    <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent" />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    <button type="button" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="lg:hidden px-4 py-2.5 bg-gray-50 text-[#3A2E1F] font-semibold text-xs rounded-lg border border-gray-200 flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-[#D97706]" /><span>Filters</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort products" className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]">
                                            <option value="newest">Newest First</option>
                                            <option value="low-high">Price: Low to High</option>
                                            <option value="high-low">Price: High to Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Product count */}
                            {!loading && filteredProducts.length > 0 && (
                                <p className="text-xs text-green-700 font-medium mt-3 pt-3 border-t border-gray-100">
                                    Showing 1–{Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
                                </p>
                            )}
                        </div>

                        {/* Search result heading */}
                        {searchQuery.trim() && !loading && (
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg sm:text-xl font-bold text-[#3A2E1F] font-body capitalize">
                                    {searchQuery.trim()}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="text-xs text-[#D97706] font-semibold hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Clear search</span>
                                </button>
                            </div>
                        )}

                        {/* PRODUCT GRID OR EMPTY STATE */}
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                    {visibleProducts.map((product) => (
                                        <ProductCard key={product.id} product={{
                                            ...product,
                                            category: product.category_name || product.category_slug,
                                            images: [product.image_url],
                                            weightOptions: product.weight_options
                                        }} />
                                    ))}
                                </div>

                                {/* Scroll loader sentinel */}
                                {hasMore && (
                                    <div ref={loaderRef} className="flex items-center justify-center py-8">
                                        {loadingMore ? (
                                            <div className="flex items-center gap-2 text-[#D97706]">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-sm font-medium">Loading more products...</span>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8" />
                                        )}
                                    </div>
                                )}

                                {/* Products count indicator */}
                                {!hasMore && visibleProducts.length > 0 && (
                                    <p className="text-center text-xs text-[#3A2E1F]/80 py-4">
                                        Showing all {filteredProducts.length} products
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-4 my-8">
                                <div className="w-16 h-16 bg-[#F5EFE0] text-[#D97706] rounded-full flex items-center justify-center mx-auto">
                                    <PackageX className="w-8 h-8" />
                                </div>
                                <h3 className="font-heading font-bold text-2xl text-[#3A2E1F]">No Products Found</h3>
                                <p className="text-sm text-[#3A2E1F]/70 max-w-md mx-auto">
                                    We couldn't find any products matching your search query or selected filters.
                                </p>
                                <button type="button" onClick={handleResetFilters} className="px-6 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full transition-colors shadow-sm">
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </section>

            {/* 3. MOBILE FILTER DRAWER OVERLAY */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex justify-start">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-full max-w-xs sm:max-w-sm bg-[#FFFDF9] h-full shadow-2xl flex flex-col z-10 animate-fadeIn overflow-y-auto">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-[#E8DEC8] flex items-center justify-between bg-[#FFFDF9] sticky top-0 z-10">
                            <div className="flex items-center gap-2 font-heading font-bold text-lg text-[#3A2E1F]">
                                <SlidersHorizontal className="w-5 h-5 text-[#D97706]" />
                                <span>Filter Products</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-2 text-[#3A2E1F]/60 hover:text-[#3A2E1F] hover:bg-[#E8DEC8]/50 rounded-full transition-colors"
                                aria-label="Close filters drawer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                            {/* Categories */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-body font-bold text-sm text-[#3A2E1F]">Categories</h3>
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset All</span>
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleCategoryChange('all')}
                                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${selectedCategory === 'all'
                                            ? 'bg-[#F5A623] text-[#3A2E1F] font-bold shadow-xs'
                                            : 'hover:bg-[#F5EFE0] text-[#3A2E1F]/80 bg-[#F5EFE0]/30 border border-[#E8DEC8]/40'
                                            }`}
                                    >
                                        <span>All Categories</span>
                                    </button>
                                    {loadingCats && Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={`cat-skel-m-${i}`}
                                            className="w-full px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 animate-pulse"
                                        >
                                            <span className="w-7 h-7 rounded-full shrink-0 bg-[#E8DEC8]" />
                                            <span className="h-3 rounded bg-[#E8DEC8]" style={{ width: `${50 + (i % 3) * 15}%` }} />
                                        </div>
                                    ))}
                                    {!loadingCats && categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleCategoryChange(cat.slug)}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${selectedCategory === cat.slug
                                                ? 'bg-[#F5A623] text-[#3A2E1F] font-bold shadow-xs'
                                                : 'hover:bg-[#F5EFE0] text-[#3A2E1F]/80 bg-[#F5EFE0]/30 border border-[#E8DEC8]/40'
                                                }`}
                                        >
                                            <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#F5EFE0] border border-[#E8DEC8] flex items-center justify-center text-sm">
                                                {cat.image_url
                                                    ? <img src={optimizeImage(cat.image_url, { width: 64, height: 64, crop: 'fill' })} alt={cat.name} width="28" height="28" loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                                    : cat.icon || '📦'}
                                            </span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range Slider */}
                            <div className="space-y-3 pt-4 border-t border-[#E8DEC8]">
                                <div className="flex items-center justify-between">
                                    <h3 id="price-range-label-mobile" className="font-body font-bold text-sm text-[#3A2E1F]">Max Price</h3>
                                    <span className="text-xs font-extrabold text-[#B45309] bg-[#F5EFE0] px-2.5 py-1 rounded-lg border border-[#E8DEC8]">
                                        {formatPrice(priceRange)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="500"
                                    max="15000"
                                    step="500"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(Number(e.target.value))}
                                    aria-labelledby="price-range-label-mobile"
                                    aria-label="Maximum price filter"
                                    className="w-full accent-[#D97706] cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-[#3A2E1F]/80">
                                    <span>{formatPrice(500)}</span>
                                    <span>{formatPrice(15000)}</span>
                                </div>
                            </div>

                            {/* Sort Options */}
                            <div className="space-y-3 pt-4 border-t border-[#E8DEC8]">
                                <h3 id="sort-by-label-mobile" className="font-body font-bold text-sm text-[#3A2E1F]">Sort By</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    aria-labelledby="sort-by-label-mobile"
                                    aria-label="Sort products"
                                    className="w-full px-3.5 py-2.5 bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl text-xs font-semibold text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                                >
                                    <option value="newest">Newest Arrivals</option>
                                    <option value="low-high">Price: Low to High</option>
                                    <option value="high-low">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-5 border-t border-[#E8DEC8] bg-[#F5EFE0]/40 sticky bottom-0 z-10">
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="w-full py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-98"
                            >
                                Show Results ({filteredProducts.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
