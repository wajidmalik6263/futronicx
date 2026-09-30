import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { getBlogs } from '../../api/blogs';

export default function BlogSection({ config }) {
    const heading = config?.heading || 'Latest from Our Blog';
    const maxItems = config?.maxItems || 3;

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data } = await getBlogs({ limit: maxItems });
                setBlogs(data.blogs || []);
            } catch (error) {
                console.error('Error fetching blogs for homepage:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, [maxItems]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (!loading && blogs.length === 0) return null;

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623] text-[#3A2E1F] text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Blog</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">{heading}</h2>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                    {Array.from({ length: maxItems }).map((_, i) => (
                        <div key={i} className="bg-white border border-[#E8DEC8] rounded-2xl overflow-hidden animate-pulse">
                            <div className="w-full h-32 sm:h-48 bg-[#E8DEC8]" />
                            <div className="p-5 space-y-3">
                                <div className="h-3 bg-[#E8DEC8] rounded w-20" />
                                <div className="h-5 bg-[#E8DEC8] rounded w-3/4" />
                                <div className="h-4 bg-[#E8DEC8] rounded w-full" />
                                <div className="h-4 bg-[#E8DEC8] rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Blog Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                to={`/blog/${blog.slug}`}
                                className="group bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full h-32 sm:h-48 overflow-hidden bg-[#F5EFE0]">
                                    <img
                                        src={blog.thumbnail || blog.image || '/placeholder.png'}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />

                                    {/* Category badge - top left */}
                                    {blog.category && (
                                        <span className="absolute top-2 left-2 z-10 px-1.5 sm:px-2 py-0.5 bg-[#F5A623] text-[#3A2E1F] rounded font-bold text-[10px] sm:text-xs shadow-sm">
                                            {blog.category}
                                        </span>
                                    )}

                                    {/* Date + read time overlay - bottom */}
                                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-1.5 sm:gap-3 p-2 sm:p-2.5 bg-gradient-to-t from-black/70 via-black/25 to-transparent text-[10px] sm:text-xs text-white font-medium">
                                        <span className="flex items-center gap-1 drop-shadow">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(blog.createdAt || blog.publishedAt)}
                                        </span>
                                        {blog.readTime && (
                                            <span className="hidden sm:flex items-center gap-1 drop-shadow">
                                                <Clock className="w-3 h-3" />
                                                {blog.readTime} min
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                                    {/* Title */}
                                    <h3 className="text-sm sm:text-base font-body font-extrabold text-[#3A2E1F] group-hover:text-[#D97706] transition-colors line-clamp-2 leading-snug">
                                        {blog.title}
                                    </h3>

                                    {/* Excerpt */}
                                    {blog.excerpt && (
                                        <p className="hidden sm:block text-sm text-[#3A2E1F]/70 line-clamp-2 leading-relaxed">
                                            {blog.excerpt}
                                        </p>
                                    )}

                                    {/* Read More */}
                                    <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#B45309] group-hover:gap-2 transition-all pt-1">
                                        <span>Read Article</span>
                                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* View All Link */}
                    <div className="text-center pt-2">
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3A2E1F] text-white text-sm font-bold rounded-full hover:bg-[#D97706] transition-colors"
                        >
                            View All Articles
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </>
            )}
        </section>
    );
}
