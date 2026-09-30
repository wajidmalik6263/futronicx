import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import NotFound from './NotFound';
import { useSettings } from '../context/SettingsContext';
import { getBlogs, getBlogCategories } from '../api/blogs';
import { categorySlug, blogListUrl, blogCategoryUrl } from '../utils/slug';
import { optimizeImage } from '../utils/imageUrl';

const PAGE_SIZE = 9;

// Editorial SEO copy for the main blog index. Categories fall back to
// generated copy but can be overridden here by slug for hand-tuned metadata.
const MAIN_BLOG_SEO = {
    title: 'Organic Living & Health Tips Blog | North Dry Fruits',
    h1: 'North Dry Fruits Blog',
    description:
        'Discover health benefits, recipes, and guides on organic dry fruits, Shilajit, and herbal teas. Read our latest wellness insights today!',
};

const CATEGORY_SEO_OVERRIDES = {
    'gilgit-baltistan-dry-fruits': {
        title: 'Gilgit-Baltistan Dry Fruits Guide',
        h1: 'Gilgit-Baltistan Dry Fruits',
        description:
            'Discover authentic dry fruits from Gilgit-Baltistan, including almonds, walnuts, apricots and other traditional products from Northern Pakistan.',
    },
};

// Build unique SEO metadata for a category page (override-aware).
function buildCategorySeo(category) {
    const slug = categorySlug(category);
    const override = CATEGORY_SEO_OVERRIDES[slug];
    if (override) return { ...override, intro: override.description };
    const name = category.name;
    return {
        title: `${name} Articles & Guides`,
        h1: name,
        description: `Read the latest ${name} articles, guides and tips from North Dry Fruits. Discover premium dry fruits, health benefits and recipes.`,
        intro: `Browse our collection of articles about ${name}. Learn about health benefits, buying tips and traditional uses of premium dry fruits.`,
    };
}

/**
 * Blog listing page. Two modes:
 *   - Index mode  (no `category` prop): /blog and /blog/page/:page
 *   - Category mode (`category` object): /blog/:slug and /blog/:slug/page/:page
 * Search (`?q=`) is intentionally kept as a query param — it is a non-canonical,
 * robots-disallowed surface, so it never competes with clean category URLs.
 */
export default function Blog({ category = null }) {
    const { settings } = useSettings();
    const { page: pageParam } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const searchQuery = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(searchQuery);

    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [notFound, setNotFound] = useState(false);

    const activeSlug = category ? categorySlug(category) : '';
    const siteUrl = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

    useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);

    useEffect(() => {
        let active = true;
        const fetchBlogs = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const params = { page: currentPage, limit: PAGE_SIZE };
                if (category) params.category = category.slug || activeSlug;
                if (searchQuery) params.search = searchQuery;
                const { data } = await getBlogs(params);
                if (!active) return;
                const tp = data.totalPages || 1;
                setBlogs(data.blogs || []);
                setTotalPages(tp);
                // Page number beyond the available range -> real 404, not empty content.
                if (currentPage > 1 && currentPage > tp) setNotFound(true);
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch blogs:', error);
                setBlogs([]);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchBlogs();
        return () => { active = false; };
    }, [currentPage, activeSlug, searchQuery, category]);

    useEffect(() => {
        let active = true;
        getBlogCategories()
            .then(({ data }) => { if (active) setCategories(data.data || []); })
            .catch(() => { if (active) setCategories([]); });
        return () => { active = false; };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchInput.trim();
        // Search resets to page 1 of the current context (index or category).
        const base = category ? blogCategoryUrl(activeSlug) : blogListUrl(1);
        navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base);
    };

    // Build a paginated URL preserving the active search query.
    const pageUrl = (page) => {
        const base = category ? blogCategoryUrl(activeSlug, page) : blogListUrl(page);
        return searchQuery ? `${base}?q=${encodeURIComponent(searchQuery)}` : base;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    if (notFound) return <NotFound />;

    // ---- SEO metadata (unique per page + per pagination page) ----
    const seo = category ? buildCategorySeo(category) : MAIN_BLOG_SEO;
    const canonicalPath = category ? blogCategoryUrl(activeSlug, currentPage) : blogListUrl(currentPage);
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
    const pageSuffix = currentPage > 1 ? ` - Page ${currentPage}` : '';
    // Paginated / search views should not be indexed as their own landing pages
    // beyond page 1; search results are always noindex.
    const noindex = Boolean(searchQuery);

    // ---- Breadcrumb JSON-LD ----
    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
            ...(category
                ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${siteUrl}${blogCategoryUrl(activeSlug)}` }]
                : []),
        ],
    };

    return (
        <div className="pb-16">
            <SEO
                {...(category
                    ? { title: `${seo.title}${pageSuffix}` }
                    : { rawTitle: `${seo.title}${pageSuffix}` })}
                description={seo.description}
                canonical={canonicalUrl}
                noindex={noindex}
                structuredData={breadcrumb}
            />

            {/* Breadcrumb */}
            <nav className="w-full px-4 sm:px-8 lg:px-16 pt-6 pb-2" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-xs text-[#5C5040]">
                    <li><Link to="/" className="hover:text-[#8A5A00] hover:underline transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-3 h-3" aria-hidden="true" /></li>
                    {category ? (
                        <>
                            <li><Link to="/blog" className="hover:text-[#8A5A00] hover:underline transition-colors">Blog</Link></li>
                            <li><ChevronRight className="w-3 h-3" aria-hidden="true" /></li>
                            <li className="text-[#3A2E1F] font-medium" aria-current="page">{category.name}</li>
                        </>
                    ) : (
                        <li className="text-[#3A2E1F] font-medium" aria-current="page">Blog</li>
                    )}
                </ol>
            </nav>

            {/* Header Section */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-2 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                            {seo.h1}
                        </h1>
                        <p className="text-sm text-[#5C5040] mt-1 max-w-2xl">
                            {category ? seo.intro : 'Discover health tips, recipes, and stories about premium dry fruits.'}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="w-full md:w-auto">
                        <div className="relative">
                            <label htmlFor="blog-search" className="sr-only">Search articles</label>
                            <input
                                id="blog-search"
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search articles..."
                                className="w-full md:w-72 h-12 px-4 pr-12 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#6B5D4A] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg text-[#8A5A00] hover:text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                                aria-label="Search blogs"
                            >
                                <Search className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Category Filter — real crawlable links */}
            {categories.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/blog"
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                !category
                                    ? 'bg-[#3A2E1F] text-white'
                                    : 'bg-white text-[#3A2E1F] border border-[#E8DEC8] hover:border-[#3A2E1F]'
                            }`}
                        >
                            All Posts
                        </Link>
                        {categories.map((cat) => {
                            const slug = categorySlug(cat);
                            const isActive = activeSlug === slug;
                            return (
                                <Link
                                    key={cat.id || slug}
                                    to={blogCategoryUrl(slug)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[#3A2E1F] text-white'
                                            : 'bg-white text-[#3A2E1F] border border-[#E8DEC8] hover:border-[#3A2E1F]'
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Blog List */}
            <section className="w-full px-4 sm:px-8 lg:px-16">
                {loading ? (
                    <div className="space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-5 bg-white border border-[#E8DEC8] rounded-xl p-4 animate-pulse">
                                <div className="w-full sm:w-64 h-44 bg-[#E8DEC8] rounded-lg shrink-0" />
                                <div className="flex-1 space-y-3 py-2">
                                    <div className="h-3 bg-[#E8DEC8] rounded w-24" />
                                    <div className="h-6 bg-[#E8DEC8] rounded w-3/4" />
                                    <div className="h-4 bg-[#E8DEC8] rounded w-full" />
                                    <div className="h-4 bg-[#E8DEC8] rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-20 h-20 bg-white border border-[#E8DEC8] rounded-2xl flex items-center justify-center mx-auto">
                            <BookOpen className="w-8 h-8 text-[#D97706]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#3A2E1F]">No articles found</h2>
                        <p className="text-sm text-[#5C5040] max-w-md mx-auto">
                            {searchQuery
                                ? `No results for "${searchQuery}". Try a different search term.`
                                : category
                                    ? `No posts in "${category.name}" yet. Explore other categories.`
                                    : 'No blog posts available yet. Check back soon!'}
                        </p>
                        {(searchQuery || category) && (
                            <Link
                                to="/blog"
                                className="inline-block mt-2 px-5 py-2 bg-[#F5A623] text-[#3A2E1F] font-semibold text-sm rounded-lg hover:bg-[#D97706] hover:text-white transition-colors"
                            >
                                View All Articles
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                to={`/blog/${blog.slug}`}
                                className="group flex flex-col sm:flex-row gap-5 bg-white border border-[#E8DEC8] rounded-xl p-4 hover:border-[#F5A623] hover:shadow-md transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="w-full sm:w-64 h-44 rounded-lg overflow-hidden bg-[#F5EFE0] shrink-0">
                                    <img
                                        src={optimizeImage(blog.thumbnail || blog.image || '/placeholder.png', { width: 256, height: 176, crop: 'fill' })}
                                        alt={blog.title}
                                        width={256}
                                        height={176}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        decoding="async"
                                        fetchPriority="low"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="space-y-2">
                                        {/* Meta row */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#3A2E1F]/70">
                                            {blog.category && (
                                                <span className="px-2.5 py-1 bg-[#F5A623] text-[#3A2E1F] rounded font-bold">
                                                    {blog.category}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(blog.createdAt || blog.publishedAt)}
                                            </span>
                                            {blog.readTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {blog.readTime} min read
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-lg sm:text-xl font-body font-extrabold text-[#3A2E1F] group-hover:text-[#D97706] transition-colors line-clamp-2">
                                            {blog.title}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-sm text-[#3A2E1F]/70 line-clamp-2 leading-relaxed font-medium">
                                            {blog.excerpt || ''}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Pagination — crawlable links to clean paths */}
            {totalPages > 1 && !loading && (
                <nav className="w-full px-4 sm:px-8 lg:px-16 mt-10" aria-label="Blog pagination">
                    <div className="flex items-center justify-center gap-2">
                        {currentPage > 1 ? (
                            <Link
                                to={pageUrl(currentPage - 1)}
                                className="p-2 rounded-lg border border-[#E8DEC8] text-[#3A2E1F]/70 hover:border-[#3A2E1F] transition-colors"
                                aria-label="Previous page"
                                rel="prev"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="p-2 rounded-lg border border-[#E8DEC8] text-[#3A2E1F]/70 opacity-40 cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </span>
                        )}

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (totalPages <= 7) return true;
                                if (page === 1 || page === totalPages) return true;
                                if (Math.abs(page - currentPage) <= 1) return true;
                                return false;
                            })
                            .map((page, idx, arr) => (
                                <React.Fragment key={page}>
                                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                                        <span className="px-1 text-[#5C5040]" aria-hidden="true">...</span>
                                    )}
                                    {page === currentPage ? (
                                        <span
                                            aria-current="page"
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold bg-[#3A2E1F] text-white"
                                        >
                                            {page}
                                        </span>
                                    ) : (
                                        <Link
                                            to={pageUrl(page)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border border-[#E8DEC8] text-[#3A2E1F]/70 hover:border-[#3A2E1F] transition-all"
                                        >
                                            {page}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}

                        {currentPage < totalPages ? (
                            <Link
                                to={pageUrl(currentPage + 1)}
                                className="p-2 rounded-lg border border-[#E8DEC8] text-[#3A2E1F]/70 hover:border-[#3A2E1F] transition-colors"
                                aria-label="Next page"
                                rel="next"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="p-2 rounded-lg border border-[#E8DEC8] text-[#3A2E1F]/70 opacity-40 cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                </nav>
            )}
        </div>
    );
}
