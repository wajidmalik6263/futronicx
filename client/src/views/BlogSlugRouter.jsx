import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBlogCategories } from '../api/blogs';
import { findCategoryBySlug } from '../utils/slug';
import Blog from './Blog';
import BlogDetail from './BlogDetail';
import { BlogDetailSkeleton } from '../components/Skeletons';

// ==========================================================================
// Disambiguates /blog/:slug between a CATEGORY listing and an ARTICLE.
// The category list is small and cached by the API layer, so this is cheap.
//   - slug matches a known category slug  -> render <Blog> in category mode
//   - otherwise                           -> render <BlogDetail> (article)
//     (BlogDetail itself shows a proper 404 if the article slug is invalid)
// A module-level cache prevents re-fetching categories on every navigation.
// ==========================================================================

let categoryCache = null;

export default function BlogSlugRouter() {
    const { slug } = useParams();
    const [resolved, setResolved] = useState(() =>
        categoryCache ? { done: true, category: findCategoryBySlug(categoryCache, slug) } : { done: false, category: null }
    );

    useEffect(() => {
        let active = true;

        const resolve = async () => {
            if (!categoryCache) {
                try {
                    const { data } = await getBlogCategories();
                    categoryCache = data.data || [];
                } catch {
                    categoryCache = [];
                }
            }
            if (active) {
                setResolved({ done: true, category: findCategoryBySlug(categoryCache, slug) });
            }
        };

        // Re-resolve whenever the slug changes.
        setResolved(categoryCache ? { done: true, category: findCategoryBySlug(categoryCache, slug) } : { done: false, category: null });
        if (!categoryCache) resolve();

        return () => { active = false; };
    }, [slug]);

    // Most /blog/:slug URLs are articles (categories are the exception), so show
    // the article skeleton while resolving — this matches what renders next and
    // avoids the generic storefront skeleton flashing first.
    if (!resolved.done) return <BlogDetailSkeleton />;

    // Category match -> listing page filtered by this category.
    if (resolved.category) {
        return <Blog category={resolved.category} />;
    }

    // No category match -> treat as an article slug.
    return <BlogDetail />;
}
