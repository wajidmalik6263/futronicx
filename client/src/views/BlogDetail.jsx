import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Tag, Share2, User, ChevronRight, ArrowRight, List } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { getBlogBySlug, getBlogs } from '../api/blogs';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { BlogDetailSkeleton } from '../components/Skeletons';
import { categorySlug, blogCategoryUrl } from '../utils/slug';
import { optimizeImage } from '../utils/imageUrl';

export default function BlogDetail() {
    const { slug } = useParams();
    const { settings } = useSettings();

    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [shopCategories, setShopCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (slug) fetchBlog();
    }, [slug]);

    // Product categories for the "Shop our range" cross-link block — connects
    // editorial content to the commerce catalog (internal linking).
    useEffect(() => {
        getCategories().then((cats) => setShopCategories((cats || []).slice(0, 6))).catch(() => { });
    }, []);

    const fetchBlog = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await getBlogBySlug(slug);
            const blogData = data;
            setBlog(blogData);

            if (blogData.categorySlug || blogData.category) {
                try {
                    const { data: related } = await getBlogs({ category: blogData.categorySlug || blogData.category, limit: 4 });
                    const relatedList = (related.blogs || []).filter(
                        (b) => b.id !== blogData.id
                    );
                    setRelatedBlogs(relatedList.slice(0, 3));
                } catch {
                    setRelatedBlogs([]);
                }
            }

            // Related products — try the blog's category first, then fall back to
            // featured products so the section always has something to show.
            try {
                const catParam = blogData.categorySlug || blogData.category;
                let products = [];
                if (catParam) {
                    products = (await getProducts({ category: catParam, limit: 4 })) || [];
                }
                if (!products.length) {
                    products = (await getProducts({ featured: true, limit: 4 })) || [];
                }
                if (!products.length) {
                    products = (await getProducts({ limit: 4 })) || [];
                }
                setRelatedProducts(products.slice(0, 4));
            } catch {
                setRelatedProducts([]);
            }
        } catch (err) {
            setError(err.response?.status === 404 ? 'not_found' : 'failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: blog.title, url }); } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    // ---- Table of Contents ----
    // Parse the article HTML, inject stable IDs onto h2/h3 headings, and build
    // a list of TOC entries. Memoized so it only runs when content changes.
    const { contentHtml, headings } = useMemo(() => {
        const raw = blog?.content || blog?.body || '';
        if (!raw || typeof document === 'undefined') {
            return { contentHtml: raw, headings: [] };
        }

        const container = document.createElement('div');
        container.innerHTML = raw;

        const slugify = (text) =>
            text.toLowerCase().trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-') || 'section';

        const items = [];
        const seen = {};
        container.querySelectorAll('h2, h3').forEach((el) => {
            const text = el.textContent.trim();
            if (!text) return;
            let id = slugify(text);
            if (seen[id] != null) {
                seen[id] += 1;
                id = `${id}-${seen[id]}`;
            } else {
                seen[id] = 0;
            }
            el.setAttribute('id', id);
            items.push({ id, text, level: el.tagName === 'H3' ? 3 : 2 });
        });

        return { contentHtml: container.innerHTML, headings: items };
    }, [blog?.content, blog?.body]);

    const [activeId, setActiveId] = useState('');
    const articleRef = useRef(null);

    // Scroll-spy: highlight the section currently being read.
    // Uses scroll position (last heading above the reading line) rather than
    // IntersectionObserver so it updates smoothly and never "skips" a section.
    useEffect(() => {
        if (!headings.length) return;

        // The line, measured from the top of the viewport, that decides which
        // section is "active" — a bit below the sticky header.
        const OFFSET = 120;
        let ticking = false;

        const updateActive = () => {
            ticking = false;
            const elements = headings
                .map((h) => ({ id: h.id, el: document.getElementById(h.id) }))
                .filter((x) => x.el);
            if (!elements.length) return;

            // If we're near the bottom of the page, force the last heading active
            // (so the final short section can highlight).
            const scrolledToBottom =
                window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
            if (scrolledToBottom) {
                setActiveId(elements[elements.length - 1].id);
                return;
            }

            let current = elements[0].id;
            for (const { id, el } of elements) {
                if (el.getBoundingClientRect().top <= OFFSET) {
                    current = id;
                } else {
                    break;
                }
            }
            setActiveId(current);
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateActive);
            }
        };

        updateActive();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [headings, contentHtml]);

    const scrollToHeading = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 96;
            window.scrollTo({ top, behavior: 'smooth' });
            setActiveId(id);
        }
    };

    // Loading skeleton (shared with the /blog/:slug router).
    if (loading) {
        return <BlogDetailSkeleton />;
    }

    // Not found
    if (error === 'not_found') {
        return (
            <div className="w-full px-4 sm:px-8 lg:px-16 py-16 text-center space-y-4">
                <SEO title="Article Not Found" description="The article you are looking for does not exist." noindex={true} />
                <h1 className="text-3xl font-bold font-body text-[#3A2E1F]">Article Not Found</h1>
                <p className="text-[#5C5040]">The article you're looking for doesn't exist or has been removed.</p>
                <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F5A623] text-[#3A2E1F] font-semibold text-sm rounded-full hover:bg-[#D97706] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </Link>
            </div>
        );
    }

    // Generic error
    if (error || !blog) {
        return (
            <div className="w-full px-4 sm:px-8 lg:px-16 py-16 text-center space-y-4">
                <h1 className="text-3xl font-bold font-body text-[#3A2E1F]">Something went wrong</h1>
                <p className="text-[#5C5040]">Unable to load this article. Please try again later.</p>
                <button onClick={fetchBlog} className="px-6 py-2.5 bg-[#F5A623] text-[#3A2E1F] font-semibold text-sm rounded-full hover:bg-[#D97706] transition-colors cursor-pointer">
                    Try Again
                </button>
            </div>
        );
    }

    // ---- Canonical + breadcrumb derived from settings (not window.location) ----
    const siteUrl = (settings.site_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
    const canonicalUrl = `${siteUrl}/blog/${slug}`;
    const catSlug = blog.categorySlug || (blog.category ? categorySlug(blog.category) : '');
    const categoryHref = catSlug ? blogCategoryUrl(catSlug) : null;

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
            ...(blog.category && categoryHref
                ? [{ "@type": "ListItem", "position": 3, "name": blog.category, "item": `${siteUrl}${categoryHref}` }]
                : []),
            { "@type": "ListItem", "position": blog.category && categoryHref ? 4 : 3, "name": blog.title, "item": canonicalUrl }
        ]
    };

    return (
        <div className="pb-16">
            <SEO
                rawTitle={blog.metaTitle || `${blog.title} | ${settings.store_name || 'North Dry Fruits'}`}
                description={blog.metaDescription || blog.excerpt || blog.summary || blog.title}
                canonical={canonicalUrl}
                type="article"
                ogImage={blog.image || blog.thumbnail}
                structuredData={[
                    {
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": blog.title,
                        "description": blog.metaDescription || blog.excerpt || blog.title,
                        "image": blog.image || blog.thumbnail || undefined,
                        "datePublished": blog.publishedAt || blog.createdAt,
                        "dateModified": blog.updatedAt || blog.publishedAt || blog.createdAt,
                        "author": { "@type": "Person", "name": blog.author || settings.store_name || "North Dry Fruits" },
                        "publisher": { "@id": `${siteUrl}/#organization` },
                        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
                    },
                    breadcrumbLd
                ]}
            />

            {/* Breadcrumb */}
            <nav className="w-full px-4 sm:px-8 lg:px-16 pt-6 pb-4" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-xs text-[#5C5040] overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <li className="shrink-0"><Link to="/" className="hover:text-[#8A5A00] hover:underline transition-colors">Home</Link></li>
                    <li className="shrink-0"><ChevronRight className="w-3 h-3" aria-hidden="true" /></li>
                    <li className="shrink-0"><Link to="/blog" className="hover:text-[#8A5A00] hover:underline transition-colors">Blog</Link></li>
                    {blog.category && categoryHref && (
                        <>
                            <li className="shrink-0"><ChevronRight className="w-3 h-3" aria-hidden="true" /></li>
                            <li className="shrink-0"><Link to={categoryHref} className="hover:text-[#8A5A00] hover:underline transition-colors">{blog.category}</Link></li>
                        </>
                    )}
                    <li className="shrink-0"><ChevronRight className="w-3 h-3" aria-hidden="true" /></li>
                    <li className="text-[#3A2E1F] font-medium truncate max-w-[160px] sm:max-w-[300px]" aria-current="page">{blog.title}</li>
                </ol>
            </nav>

            {/* Two-column layout: sticky Contents sidebar + article */}
            <div className="w-full px-4 sm:px-8 lg:px-16 mt-2 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:gap-12">

                {/* Contents (Table of Contents) sidebar */}
                {headings.length > 0 && (
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 bg-white border border-[#E8DEC8] rounded-2xl shadow-sm max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
                            <div className="flex items-center gap-2 text-[#3A2E1F] px-5 pt-5 pb-3 border-b border-[#F0EADB]">
                                <List className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                                <span className="text-xs font-extrabold uppercase tracking-[0.12em]">Contents</span>
                            </div>
                            <nav aria-label="Table of contents" className="overflow-y-auto overflow-x-hidden py-2">
                                <ul>
                                    {headings.map((h) => {
                                        const isActive = activeId === h.id;
                                        return (
                                            <li key={h.id}>
                                                <a
                                                    href={`#${h.id}`}
                                                    onClick={(e) => scrollToHeading(e, h.id)}
                                                    aria-current={isActive ? 'true' : undefined}
                                                    className={[
                                                        'block text-sm leading-snug border-l-[3px] transition-colors duration-150 break-words whitespace-normal',
                                                        h.level === 3 ? 'pl-7 pr-4 py-2' : 'pl-5 pr-4 py-2',
                                                        isActive
                                                            ? 'border-[#F5A623] bg-[#F5A623]/[0.12] text-[#B45309] font-semibold'
                                                            : 'border-transparent text-[#6B5F4D] hover:text-[#3A2E1F] hover:bg-[#F7F3E9]',
                                                    ].join(' ')}
                                                >
                                                    {h.text}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Main column */}
                <div className="min-w-0 bg-white border border-[#E8DEC8] rounded-2xl shadow-md p-5 sm:p-8 lg:p-10">

            {/* Article Header */}
            <header className="w-full space-y-4">
                {blog.category && categoryHref && (
                    <Link
                        to={categoryHref}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5A623]/10 text-[#8A5A00] rounded-full text-xs font-bold hover:bg-[#F5A623]/20 transition-colors"
                    >
                        <Tag className="w-3 h-3" aria-hidden="true" />
                        {blog.category}
                    </Link>
                )}

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-body font-extrabold text-[#3A2E1F] leading-tight">
                    {blog.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-[#5C5040] pb-2">
                    {blog.author && (
                        <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" aria-hidden="true" />
                            {blog.author}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {formatDate(blog.publishedAt || blog.createdAt)}
                    </span>
                    {blog.readTime && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" aria-hidden="true" />
                            {blog.readTime} min read
                        </span>
                    )}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 hover:text-[#8A5A00] transition-colors cursor-pointer ml-auto"
                        aria-label="Share article"
                    >
                        <Share2 className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                </div>
            </header>

            {/* Article Content */}
            <article ref={articleRef} className="w-full mt-8 overflow-hidden scroll-mt-24">
                <div
                    className="blog-content text-[#3A2E1F] text-base sm:text-lg font-medium leading-relaxed max-w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
            </article>

                </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
                <div className="w-full px-4 sm:px-8 lg:px-16 mt-10 pt-6 border-t border-[#E8DEC8]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#5C5040] uppercase tracking-wider">Tags:</span>
                        {blog.tags.map((tag) => (
                            <Link
                                key={tag}
                                to={`/blog?q=${encodeURIComponent(tag)}`}
                                className="px-3 py-1 bg-[#F5EFE0] text-[#5C5040] text-xs font-medium rounded-full border border-[#E8DEC8] hover:border-[#F5A623] hover:text-[#8A5A00] transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Shop our range — links editorial content into the catalog */}
            {shopCategories.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 mt-12">
                    <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-xl font-extrabold font-body text-[#3A2E1F]">Shop Our Range</h2>
                                <p className="text-sm text-[#5C5040] mt-1">Explore premium dry fruits and nuts from Gilgit-Baltistan.</p>
                            </div>
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-1.5 shrink-0 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full transition-colors"
                            >
                                Browse All Products
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {shopCategories.map((cat) => (
                                <Link
                                    key={cat.id || cat.slug}
                                    to={`/products/${cat.slug}`}
                                    className="px-4 py-2 bg-[#F5EFE0] text-[#3A2E1F] text-sm font-semibold rounded-full border border-[#E8DEC8] hover:border-[#F5A623] hover:text-[#B45309] transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Back to Blog */}
            <div className="w-full px-4 sm:px-8 lg:px-16 mt-8">
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A5A00] hover:text-[#D97706] hover:underline transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Back to all articles
                </Link>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 mt-16 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Related Products</h2>
                        <Link to="/products" className="text-xs font-bold text-[#8A5A00] hover:text-[#D97706] hover:underline flex items-center gap-1 transition-colors">
                            Shop All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {relatedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Related Articles */}
            {relatedBlogs.length > 0 && (
                <section className="w-full px-4 sm:px-8 lg:px-16 mt-16 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F]">Related Articles</h2>
                        <Link to="/blog" className="text-xs font-bold text-[#8A5A00] hover:text-[#D97706] hover:underline flex items-center gap-1 transition-colors">
                            View All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedBlogs.map((related) => (
                            <Link
                                key={related.id}
                                to={`/blog/${related.slug}`}
                                className="group bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden hover:border-[#F5A623] hover:shadow-lg transition-all"
                            >
                                <div className="aspect-video overflow-hidden bg-[#F5EFE0]">
                                    <img
                                        src={optimizeImage(related.thumbnail || related.image || '/placeholder.png', { width: 480, height: 270, crop: 'fill' })}
                                        alt={related.title}
                                        width={480}
                                        height={270}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
                                    />
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-[#5C5040]">
                                        <Calendar className="w-3 h-3" aria-hidden="true" />
                                        {formatDate(related.createdAt || related.publishedAt)}
                                    </div>
                                    <h3 className="text-base font-bold font-body text-[#3A2E1F] group-hover:text-[#8A5A00] transition-colors line-clamp-2">
                                        {related.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
