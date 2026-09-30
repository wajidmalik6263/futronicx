import React from 'react';

export function ProductSkeleton() {
    return (
        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full animate-pulse shadow-sm">
            <div className="space-y-4">
                <div className="w-full aspect-square bg-[#F5EFE0] rounded-2xl"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-[#E8DEC8] rounded w-1/4"></div>
                    <div className="h-5 bg-[#E8DEC8] rounded w-3/4"></div>
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E8DEC8] space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-[#E8DEC8] rounded w-1/3"></div>
                </div>
                <div className="h-10 bg-[#E8DEC8] rounded-full w-full"></div>
            </div>
        </div>
    );
}

export function CategorySkeleton() {
    return (
        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 animate-pulse h-32">
            <div className="w-12 h-12 rounded-full bg-[#F5EFE0]"></div>
            <div className="h-4 bg-[#E8DEC8] rounded w-16"></div>
        </div>
    );
}

// Products listing skeleton — mirrors the ACTUAL /products layout (page header
// + left filter sidebar + product grid) so the Suspense reload fallback flows
// seamlessly into the page's own internal loading state (no double-skeleton).
export function StorefrontSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6 space-y-3">
                <div className="h-9 sm:h-10 w-56 bg-[#F5EFE0] rounded" />
                <div className="h-4 w-96 max-w-full bg-[#F5EFE0] rounded" />
            </section>

            {/* Sidebar + grid */}
            <section className="w-full px-4 sm:px-8 lg:px-16">
                <div className="relative lg:flex lg:gap-8">
                    {/* Filter sidebar */}
                    <aside className="hidden lg:block w-[280px] shrink-0 self-start">
                        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="h-6 w-24 bg-[#F5EFE0] rounded border-b border-[#E8DEC8] pb-4" />
                            <div className="space-y-2.5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-[#E8DEC8]" />
                                        <div className="h-3.5 bg-[#F5EFE0] rounded flex-1" style={{ maxWidth: `${60 + ((i * 7) % 30)}%` }} />
                                    </div>
                                ))}
                            </div>
                            <div className="h-24 bg-[#F5EFE0] rounded-xl" />
                        </div>
                    </aside>

                    {/* Main column: search & sort toolbar + product grid */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* Search & Sort toolbar */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* search box */}
                                <div className="w-full sm:flex-1 h-11 bg-[#F5EFE0] rounded-lg" />
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    {/* mobile filter button */}
                                    <div className="lg:hidden h-10 w-24 bg-[#F5EFE0] rounded-lg" />
                                    {/* sort select */}
                                    <div className="h-11 w-36 bg-[#F5EFE0] rounded-lg" />
                                </div>
                            </div>
                        </div>

                        {/* Product grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProductSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Individual blog article skeleton — mirrors the two-column BlogDetail layout
// (sticky Contents sidebar card + white article card). Lives here (in the
// eagerly-loaded Skeletons module) so it can be used as the Suspense fallback
// on a full reload, before the lazy BlogDetail chunk downloads.
export function BlogDetailSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            {/* Breadcrumb */}
            <div className="w-full px-4 sm:px-8 lg:px-16 pt-6 pb-4">
                <div className="h-3.5 w-56 bg-[#E8DEC8] rounded" />
            </div>

            <div className="w-full px-4 sm:px-8 lg:px-16 mt-2 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:gap-12">
                {/* Contents sidebar skeleton */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 bg-white border border-[#E8DEC8] rounded-2xl shadow-sm p-5 space-y-3">
                        <div className="h-4 w-24 bg-[#E8DEC8] rounded" />
                        <div className="pt-1 space-y-2.5">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-3.5 bg-[#EFE7D4] rounded"
                                    style={{ width: `${70 + ((i * 7) % 25)}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main article card skeleton */}
                <div className="min-w-0 bg-white border border-[#E8DEC8] rounded-2xl shadow-md p-5 sm:p-8 lg:p-10 space-y-5">
                    {/* category chip */}
                    <div className="h-6 w-28 bg-[#EFE7D4] rounded-full" />
                    {/* title */}
                    <div className="space-y-3">
                        <div className="h-8 sm:h-10 bg-[#E8DEC8] rounded w-11/12" />
                        <div className="h-8 sm:h-10 bg-[#E8DEC8] rounded w-2/3" />
                    </div>
                    {/* meta row */}
                    <div className="flex flex-wrap gap-4 pb-2">
                        <div className="h-4 w-28 bg-[#EFE7D4] rounded" />
                        <div className="h-4 w-24 bg-[#EFE7D4] rounded" />
                        <div className="h-4 w-20 bg-[#EFE7D4] rounded" />
                    </div>

                    {/* content lines */}
                    <div className="pt-4 space-y-6">
                        {Array.from({ length: 3 }).map((_, block) => (
                            <div key={block} className="space-y-3">
                                {/* section heading */}
                                <div className="h-6 bg-[#E8DEC8] rounded w-1/2 mt-2" />
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-3.5 bg-[#EFE7D4] rounded"
                                        style={{ width: `${82 + ((i * 5) % 18)}%` }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Product detail skeleton — mirrors the two-column gallery + info layout so a
// full reload of /product/:slug doesn't flash the product-grid skeleton.
export function ProductDetailSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 animate-pulse">
            <div className="h-4 w-64 bg-[#F5EFE0] rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="space-y-4">
                    <div className="aspect-square bg-[#F5EFE0] rounded-2xl" />
                    <div className="flex gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F5EFE0] rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="space-y-5 py-4">
                    <div className="h-5 bg-[#F5EFE0] rounded w-24" />
                    <div className="h-10 bg-[#F5EFE0] rounded w-3/4" />
                    <div className="h-8 bg-[#F5EFE0] rounded w-1/3" />
                    <div className="h-32 bg-[#F5EFE0] rounded" />
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-10 w-20 bg-[#F5EFE0] rounded-full" />
                        ))}
                    </div>
                    <div className="h-12 bg-[#F5EFE0] rounded-full w-full" />
                </div>
            </div>
        </div>
    );
}

// Blog listing skeleton — mirrors the stacked article-row layout on /blog.
export function BlogListSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            <div className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6 space-y-3">
                <div className="h-9 w-48 bg-[#E8DEC8] rounded" />
                <div className="h-4 w-80 max-w-full bg-[#EFE7D4] rounded" />
            </div>
            <div className="w-full px-4 sm:px-8 lg:px-16 space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-5 bg-white border border-[#E8DEC8] rounded-xl p-4">
                        <div className="w-full sm:w-64 h-44 bg-[#E8DEC8] rounded-lg shrink-0" />
                        <div className="flex-1 space-y-3 py-2">
                            <div className="h-4 w-24 bg-[#EFE7D4] rounded" />
                            <div className="h-6 w-3/4 bg-[#E8DEC8] rounded" />
                            <div className="h-4 w-full bg-[#EFE7D4] rounded" />
                            <div className="h-4 w-5/6 bg-[#EFE7D4] rounded" />
                            <div className="h-4 w-1/3 bg-[#EFE7D4] rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Generic content-page skeleton for simple, single-column pages (About,
// Contact, Privacy, Track Order, Cart, etc.). Keeps the reload fallback close
// to a plain article/form layout instead of a product grid.
export function SimplePageSkeleton() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
            <div className="h-9 w-2/3 bg-[#F5EFE0] rounded" />
            <div className="h-4 w-1/2 bg-[#F5EFE0] rounded" />
            <div className="space-y-3 pt-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 bg-[#F5EFE0] rounded"
                        style={{ width: `${82 + ((i * 5) % 18)}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

// Track Order skeleton — mirrors the header + search form card (two inputs and
// a submit button) so the reload fallback matches the actual page.
export function TrackOrderSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6 space-y-3">
                <div className="h-9 sm:h-10 w-64 bg-[#F5EFE0] rounded" />
                <div className="h-4 w-96 max-w-full bg-[#F5EFE0] rounded" />
            </section>

            {/* Search form card */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-8">
                <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-[#F5EFE0] rounded" />
                            <div className="h-12 bg-[#F5EFE0] rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-[#F5EFE0] rounded" />
                            <div className="h-12 bg-[#F5EFE0] rounded-xl" />
                        </div>
                    </div>
                    <div className="h-12 bg-[#F5EFE0] rounded-xl w-full" />
                </div>
            </section>
        </div>
    );
}

// About page skeleton — header + brand-story block (text column + image) and a
// row of feature cards, matching the real About layout.
export function AboutSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6 space-y-3">
                <div className="h-6 w-40 bg-[#F5EFE0] rounded-full" />
                <div className="h-9 sm:h-10 w-72 max-w-full bg-[#F5EFE0] rounded" />
                <div className="h-4 w-[32rem] max-w-full bg-[#F5EFE0] rounded" />
            </section>

            {/* Brand story */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10">
                <div className="flex flex-col lg:flex-row gap-8 bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8">
                    <div className="flex-1 space-y-4">
                        <div className="h-3 w-32 bg-[#F5EFE0] rounded" />
                        <div className="h-7 w-3/4 bg-[#F5EFE0] rounded" />
                        <div className="space-y-2.5 pt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-3.5 bg-[#F5EFE0] rounded" style={{ width: `${80 + ((i * 5) % 18)}%` }} />
                            ))}
                        </div>
                    </div>
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="w-full aspect-4/3 rounded-xl bg-[#F5EFE0]" />
                    </div>
                </div>
            </section>

            {/* Feature cards */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pb-10 space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-[#F5EFE0] rounded" />
                    <div className="h-4 w-96 max-w-full bg-[#F5EFE0] rounded" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-[#E8DEC8] rounded-xl p-5 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F5EFE0]" />
                            <div className="h-4 w-2/3 bg-[#F5EFE0] rounded" />
                            <div className="h-3 w-full bg-[#F5EFE0] rounded" />
                            <div className="h-3 w-5/6 bg-[#F5EFE0] rounded" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// Contact page skeleton — header + two-column layout (message form card on the
// left, contact-info cards on the right), matching the real Contact layout.
export function ContactSkeleton() {
    return (
        <div className="pb-16 animate-pulse">
            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6 space-y-3">
                <div className="h-9 sm:h-10 w-72 max-w-full bg-[#F5EFE0] rounded" />
                <div className="h-4 w-[30rem] max-w-full bg-[#F5EFE0] rounded" />
            </section>

            {/* Form + info */}
            <section className="w-full px-4 sm:px-8 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Form card */}
                    <div className="lg:col-span-7 bg-white border border-[#E8DEC8] rounded-xl p-6 sm:p-8 space-y-5">
                        <div className="space-y-2 border-b border-[#E8DEC8] pb-4">
                            <div className="h-6 w-52 bg-[#F5EFE0] rounded" />
                            <div className="h-3 w-80 max-w-full bg-[#F5EFE0] rounded" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                                <div className="h-11 bg-[#F5EFE0] rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                                <div className="h-11 bg-[#F5EFE0] rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                            <div className="h-11 bg-[#F5EFE0] rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                            <div className="h-28 bg-[#F5EFE0] rounded-xl" />
                        </div>
                        <div className="h-12 bg-[#F5EFE0] rounded-xl w-full" />
                    </div>

                    {/* Info sidebar */}
                    <div className="lg:col-span-5 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white border border-[#E8DEC8] rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F5EFE0] shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-[#F5EFE0] rounded" />
                                    <div className="h-3 w-2/3 bg-[#F5EFE0] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

// Cart skeleton — header banner + line-items list (2 cols) and summary sidebar.
export function CartSkeleton() {
    return (
        <div className="space-y-10 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 animate-pulse">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E8DEC8] pb-6">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-[#F5EFE0] rounded" />
                    <div className="h-3 w-56 bg-[#F5EFE0] rounded" />
                </div>
                <div className="h-4 w-36 bg-[#F5EFE0] rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Line items */}
                <div className="lg:col-span-2">
                    <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-[#E8DEC8]/60 last:border-0">
                                <div className="w-20 h-20 rounded-2xl bg-[#F5EFE0] shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-2/3 bg-[#F5EFE0] rounded" />
                                    <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                                </div>
                                <div className="h-8 w-28 bg-[#F5EFE0] rounded-full" />
                                <div className="h-4 w-16 bg-[#F5EFE0] rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary sidebar */}
                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="h-6 w-32 bg-[#F5EFE0] rounded border-b border-[#E8DEC8] pb-4" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <div className="h-4 w-20 bg-[#F5EFE0] rounded" />
                            <div className="h-4 w-16 bg-[#F5EFE0] rounded" />
                        </div>
                    ))}
                    <div className="h-12 bg-[#F5EFE0] rounded-full w-full mt-2" />
                </div>
            </div>
        </div>
    );
}

// Checkout skeleton — header + two-column layout (form on the left, order
// summary aside on the right).
export function CheckoutSkeleton() {
    return (
        <div className="space-y-10 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 animate-pulse">
            {/* Header */}
            <div className="border-b border-[#E8DEC8] pb-4 space-y-2">
                <div className="h-8 w-40 bg-[#F5EFE0] rounded" />
                <div className="h-3 w-56 bg-[#F5EFE0] rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Form */}
                <div className="space-y-8">
                    <div className="space-y-5">
                        <div className="h-6 w-40 bg-[#F5EFE0] rounded" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={`space-y-1.5 ${i >= 2 ? 'sm:col-span-2' : ''}`}>
                                    <div className="h-3 w-24 bg-[#F5EFE0] rounded" />
                                    <div className="h-11 bg-[#F5EFE0] rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-6 w-40 bg-[#F5EFE0] rounded" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-14 bg-[#F5EFE0] rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Order summary aside */}
                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="h-6 w-32 bg-[#F5EFE0] rounded border-b border-[#E8DEC8] pb-4" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#F5EFE0] shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-2/3 bg-[#F5EFE0] rounded" />
                                <div className="h-3 w-1/3 bg-[#F5EFE0] rounded" />
                            </div>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-[#E8DEC8] space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 w-20 bg-[#F5EFE0] rounded" />
                                <div className="h-4 w-16 bg-[#F5EFE0] rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Wishlist skeleton — header (title + count + clear button) and a product grid.
export function WishlistSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto pb-16 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="space-y-2">
                    <div className="h-8 w-44 bg-[#F5EFE0] rounded" />
                    <div className="h-4 w-32 bg-[#F5EFE0] rounded" />
                </div>
                <div className="h-9 w-28 bg-[#F5EFE0] rounded-full" />
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

// Admin LOGIN skeleton — a centered card (logo + two inputs + button) that
// mirrors the login form, NOT the dashboard. Used as the Suspense fallback for
// the /admin/login route so a reload no longer flashes the full dashboard
// shell (AdminSkeleton) before the login form loads.
export function AdminLoginSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6 animate-pulse">
                {/* Logo / title */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100" />
                    <div className="h-6 w-40 bg-gray-100 rounded" />
                    <div className="h-3 w-52 bg-gray-50 rounded" />
                </div>
                {/* Fields */}
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-11 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-11 bg-gray-100 rounded-lg" />
                    </div>
                </div>
                {/* Submit button */}
                <div className="h-11 bg-gray-200 rounded-lg w-full" />
            </div>
        </div>
    );
}

export function AdminSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-4 space-y-4">
                <div className="h-8 bg-gray-100 rounded-lg w-32 animate-pulse"></div>
                <div className="space-y-2 pt-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-9 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-20"></div>
                            <div className="h-7 bg-gray-100 rounded w-16"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="h-5 bg-gray-100 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                                    <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                                </div>
                                <div className="h-4 bg-gray-100 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
