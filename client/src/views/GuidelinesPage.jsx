import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, ArrowRight, ShieldCheck, Snowflake, Truck, HelpCircle,
    ShoppingCart, CreditCard, Package, Leaf, ClipboardCheck, RotateCcw,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

// ---------------------------------------------------------------------------
// Guidelines page (/guidelines)
// ---------------------------------------------------------------------------
// A customer-first, SEO/LLM-friendly reference page covering how to choose,
// store and order dry fruits from North Dry Fruits.
//
// SOURCING NOTE FOR EDITORS: every business-specific fact on this page is
// grounded in the site's own verified copy (checkout flow, /shipping and
// /privacy?tab=refund policies, About page, seeded categories). Where an exact
// figure is not confirmed in one authoritative place (e.g. shelf life, exact
// return window), the copy points customers to the relevant page instead of
// stating an unverified number. Do NOT insert invented shelf-life periods,
// certifications, or health claims here.
// ---------------------------------------------------------------------------

const LAST_UPDATED = 'September 2026';

export default function GuidelinesPage() {
    const { settings } = useSettings();
    const storeName = (settings && settings.store_name) || 'North Dry Fruits';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/guidelines`;

    // Product-specific selection guidance. Facts here are general, widely
    // documented characteristics of each dry fruit — not claims about a
    // specific batch's origin, grade or health effect.
    const productGuides = [
        {
            name: 'Walnuts',
            slug: 'walnuts',
            text: 'Choose kernels that look plump and light in colour rather than dark or shrivelled. Walnuts are high in natural oils, so a fresh, mild aroma is a good sign — a sharp or bitter smell can mean the oils have turned. Shelled kernels are convenient; in-shell walnuts keep longer.',
        },
        {
            name: 'Dried Apricots',
            slug: 'dried-apricots',
            text: 'Look for whole, intact fruit with a soft, pliable texture. Naturally sun-dried apricots are usually darker and less uniform in colour than sulphur-treated ones. Check the product page for how each batch is processed before ordering.',
        },
        {
            name: 'Almonds',
            slug: 'almonds',
            text: 'Prefer whole, uniform kernels without cracks or a dusty coating. A clean, slightly sweet aroma is normal; a stale or oily smell is not. Both in-shell and shelled almonds are common — shelled are ready to use, in-shell tend to stay fresh longer.',
        },
        {
            name: 'Dried Mulberries',
            slug: 'dried-mulberries',
            text: 'Good dried mulberries are chewy rather than hard, and should not be clumped together in a solid block (a sign of moisture). White and black varieties differ in sweetness and colour — check the product description for the type you want.',
        },
        {
            name: 'Pine Nuts (Chilgoza)',
            slug: 'pine-nuts',
            text: 'Choose kernels with an even, ivory-to-golden colour and no dark or oily patches. Pine nuts are rich in oil and best kept sealed and cool. Shelled kernels are ready to eat; in-shell chilgoza keeps longer but needs cracking.',
        },
        {
            name: 'Raisins',
            slug: 'raisins',
            text: 'Look for fruit that is soft and slightly moist, not dried out or sugar-crusted. Green, black and seedless varieties vary in size and sweetness — the product page describes each one.',
        },
        {
            name: 'Dates',
            slug: 'dates',
            text: 'Fresh dates should feel soft and slightly glossy, not dry or fermented-smelling. Some sugar crystallising on the surface is natural. Varieties differ widely in size and sweetness, so read the product description.',
        },
        {
            name: 'Pistachios',
            slug: 'pistachios',
            text: 'Choose nuts with naturally split, clean shells and green kernels. Roasted and salted options taste different from raw kernels — pick based on how you plan to use them.',
        },
    ];

    const chooseFactors = [
        ['Freshness', 'Buy from a source that packs to order and check the best-before date on the label.'],
        ['Appearance', 'Look for whole, uniform pieces with natural colour and no visible mould or excessive dust.'],
        ['Aroma', 'A clean, natural smell is a good sign. A stale, musty or sharp odour usually is not.'],
        ['Texture', 'Nuts should feel firm and dried fruit pliable — not damp, sticky or rock-hard.'],
        ['Cleanliness', 'Good products are sorted and free of shells, stalks and grit.'],
        ['Packaging', 'Prefer sealed packaging that protects the product from moisture and air.'],
        ['Size / grade', 'Product pages describe size or grade where relevant so you know what you are buying.'],
        ['Product information', 'Read the description, weight option and any processing notes on the product page.'],
    ];

    const orderSteps = [
        'Browse the Dry Fruits & Nuts catalogue and open a product you like.',
        'Choose the weight option you want (many products offer sizes such as 250g, 500g or 1kg).',
        'Add the item to your cart, then keep shopping or go to the cart.',
        'Review the items and quantities in your cart.',
        'At checkout, enter your delivery details: name, phone, complete address and city (email is optional, for order updates).',
        'Select a payment method.',
        'Confirm and place your order.',
        'Use the Track Order page with your Order ID and phone number to follow its status.',
    ];

    // Verified from server/routes/payments.js + infoPages.js. COD is always
    // available; wallet/bank options appear when the store has them configured.
    const payments = [
        ['Cash on Delivery (COD)', 'Pay when your order arrives.'],
        ['Easypaisa / JazzCash', 'Send payment via the mobile wallet and upload your receipt at checkout, where these options are available.'],
        ['Bank Transfer', 'Transfer to the store bank account and upload your receipt at checkout, where available.'],
    ];

    // FAQ — every answer is grounded in verified site copy. Shelf life and the
    // exact return window are intentionally deferred to the product page / policy
    // page rather than stated as an unverified number.
    const faqs = [
        {
            q: 'How should dry fruits be stored?',
            a: 'Keep dry fruits and nuts in an airtight container, away from heat, moisture and direct sunlight. Oil-rich nuts such as walnuts and pine nuts stay fresher when kept cool, and refrigeration can help once a pack is opened.',
        },
        {
            q: 'How can I keep dry fruits fresh after opening?',
            a: 'Reseal the pack or move the contents to an airtight container, press out excess air, and store somewhere cool and dry. Avoid leaving products open in warm or humid conditions.',
        },
        {
            q: 'How do I choose quality walnuts?',
            a: 'Look for plump, light-coloured kernels with a fresh, mild aroma. A sharp or bitter smell can mean the natural oils have turned. In-shell walnuts generally keep longer than shelled kernels.',
        },
        {
            q: 'How should dried apricots be stored?',
            a: 'Store dried apricots in a sealed container away from heat and sunlight so they stay soft. Refrigeration can extend freshness after opening. Check the best-before date on the pack.',
        },
        {
            q: 'How can I order dry fruits online in Pakistan?',
            a: 'Open a product, choose a weight option, add it to your cart, then go to checkout and enter your delivery details. Select a payment method, confirm your order, and track it from the Track Order page.',
        },
        {
            q: 'How are dry fruits packaged?',
            a: 'Orders are packed to protect the product before dispatch. For exact package sizes and materials for a specific item, check the product page. [VERIFY THIS]',
        },
        {
            q: 'Do you deliver throughout Pakistan?',
            a: 'Yes. North Dry Fruits delivers nationwide across Pakistan. See the Shipping page for current delivery timing and any charges.',
        },
        {
            q: 'What payment methods can I use?',
            a: 'Cash on Delivery is always available. Easypaisa, JazzCash and bank transfer may also be offered — for those, you send the payment and upload a receipt at checkout.',
        },
        {
            q: 'How long do dry fruits last?',
            a: 'Shelf life depends on the product and how it is stored. Always check the best-before date printed on the pack. [VERIFY PRODUCT SHELF LIFE]',
        },
        {
            q: 'How do I track my order?',
            a: 'Go to the Track Order page and enter your Order ID and phone number to see the latest status of your order.',
        },
        {
            q: 'What should I do if my order arrives damaged?',
            a: 'Contact customer support promptly with photos of the issue. See the Return & Refund Policy for what is covered and the steps to follow.',
        },
        {
            q: 'Are your products organic or from Gilgit-Baltistan?',
            a: 'North Dry Fruits sources products from Gilgit-Baltistan and northern Pakistan, and works directly with growers. Some varieties come from other regions, so the exact origin and processing are described on each product page.',
        },
    ];

    // Internal links used in the "Related pages" block and throughout the copy.
    const relatedLinks = [
        { to: '/products', label: 'Shop all dry fruits & nuts' },
        { to: '/products/walnuts', label: 'Walnuts' },
        { to: '/products/almonds', label: 'Almonds' },
        { to: '/products/dried-apricots', label: 'Dried Apricots' },
        { to: '/products/dried-mulberries', label: 'Dried Mulberries' },
        { to: '/guides', label: 'Guides & articles' },
        { to: '/shipping', label: 'Shipping & delivery' },
        { to: '/faq', label: 'FAQ' },
        { to: '/about', label: 'About us' },
        { to: '/contact', label: 'Contact' },
    ];

    const structuredData = useMemo(() => ({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': canonical,
                url: canonical,
                name: 'Dry Fruits Buying & Quality Guidelines',
                description: 'Practical guidelines for choosing, storing and ordering dry fruits and nuts from North Dry Fruits, with delivery across Pakistan.',
                isPartOf: { '@type': 'WebSite', name: storeName, url: origin },
                publisher: { '@type': 'Organization', name: storeName, url: origin },
                dateModified: '2026-09-01',
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: 'Guidelines', item: canonical },
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
        ],
    }), [canonical, origin, storeName]);

    const sectionTitle = (Icon, text) => (
        <h2 className="text-2xl font-extrabold font-body text-[#3A2E1F] mb-4 flex items-center gap-2">
            <Icon className="w-6 h-6 text-[#D97706]" />
            {text}
        </h2>
    );

    return (
        <div className="pb-16">
            <SEO
                rawTitle={`Dry Fruits Buying & Quality Guidelines | ${storeName}`}
                description="How to choose, store and order dry fruits and nuts — freshness, packaging, payment, shipping and customer guidelines from North Dry Fruits, delivered across Pakistan."
                canonical={canonical}
                structuredData={structuredData}
            />

            {/* Header */}
            <section className="w-full px-4 sm:px-8 lg:px-16 pt-8 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/15 text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Guidelines</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">
                    Dry Fruits Buying &amp; Quality Guidelines
                </h1>
                <p className="text-sm text-[#3A2E1F]/80 mt-2 max-w-2xl leading-relaxed">
                    A practical guide to choosing quality dry fruits and nuts, storing them well,
                    ordering online and knowing what to expect on delivery. Written to help you
                    shop with confidence at {storeName}.
                </p>
                <p className="text-xs text-[#3A2E1F]/50 mt-3">Last updated: {LAST_UPDATED}</p>
            </section>

            <div className="w-full px-4 sm:px-8 lg:px-16 space-y-10 max-w-4xl">

                {/* 1. Introduction */}
                <section>
                    {sectionTitle(BookOpen, 'About these guidelines')}
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                        These guidelines explain what to look for when buying dry fruits, how to
                        store them so they stay fresh, and how ordering, packaging, payment and
                        delivery work at {storeName}. The aim is simple: help you make a good choice
                        and enjoy your order at its best.
                    </p>
                </section>

                {/* 2. How to choose */}
                <section>
                    {sectionTitle(ShieldCheck, 'How to choose quality dry fruits')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {chooseFactors.map(([label, text]) => (
                            <p key={label} className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                                <span className="font-bold text-[#3A2E1F]">{label}. </span>{text}
                            </p>
                        ))}
                    </div>
                </section>

                {/* 3. Product-specific guidelines */}
                <section>
                    {sectionTitle(Leaf, 'Product-specific guidelines')}
                    <div className="space-y-4">
                        {productGuides.map((p) => (
                            <div key={p.slug}>
                                <h3 className="font-bold text-base text-[#3A2E1F]">
                                    <Link to={`/products/${p.slug}`} className="hover:text-[#D97706]">{p.name}</Link>
                                </h3>
                                <p className="text-sm text-[#3A2E1F]/80 mt-1 leading-relaxed">{p.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Storage */}
                <section>
                    {sectionTitle(Snowflake, 'Storage guidelines')}
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                        Most dry fruits and nuts keep best in an airtight container, away from heat,
                        moisture and direct sunlight. Beyond that, requirements differ by product:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[#3A2E1F]/80">
                        <li><span className="font-bold text-[#3A2E1F]">Oil-rich nuts (walnuts, pine nuts):</span> keep cool and sealed; refrigeration helps after opening because their natural oils can turn over time.</li>
                        <li><span className="font-bold text-[#3A2E1F]">Almonds, pistachios, cashews:</span> store in a cool, dry, sealed container; in-shell versions keep longer than kernels.</li>
                        <li><span className="font-bold text-[#3A2E1F]">Soft dried fruit (apricots, mulberries, dates, raisins):</span> keep sealed to retain moisture and softness; refrigerate after opening in warm weather.</li>
                        <li><span className="font-bold text-[#3A2E1F]">After opening:</span> reseal the pack or transfer to an airtight jar and press out excess air.</li>
                    </ul>
                </section>

                {/* 5. Freshness & shelf life */}
                <section>
                    {sectionTitle(ClipboardCheck, 'Freshness & shelf life')}
                    <ul className="space-y-2 text-sm text-[#3A2E1F]/80">
                        <li>Store products correctly — good storage is the single biggest factor in keeping dry fruits fresh.</li>
                        <li>Check the best-before information printed on the packaging and use it to plan your purchase.</li>
                        <li>After opening, check the smell, colour and texture; a stale or off aroma means it is past its best.</li>
                        <li>If a sealed product looks or smells wrong on arrival, contact customer support with photos.</li>
                        <li>Exact shelf life varies by product and storage. [VERIFY PRODUCT SHELF LIFE]</li>
                    </ul>
                </section>

                {/* 6. Packaging */}
                <section>
                    {sectionTitle(Package, 'Packaging guidelines')}
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                        Products are packed to protect them before dispatch and to keep out moisture
                        and air. Many items are offered in more than one weight option (for example
                        250g, 500g or 1kg), shown on the product page.
                    </p>
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed mt-2">
                        When your order arrives, check that the packaging is sealed and undamaged
                        before opening. Exact package materials, sealing method and labelling for a
                        specific product: [VERIFY THIS].
                    </p>
                </section>

                {/* 7. Ordering */}
                <section>
                    {sectionTitle(ShoppingCart, 'How to order from North Dry Fruits')}
                    <ol className="space-y-2 text-sm text-[#3A2E1F]/80 list-decimal pl-5">
                        {orderSteps.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
                    </ol>
                    <p className="text-sm text-[#3A2E1F]/80 mt-3">
                        Ready to start? <Link to="/products" className="text-[#D97706] font-semibold hover:underline">Browse the catalogue</Link>.
                    </p>
                </section>

                {/* 8. Payment */}
                <section>
                    {sectionTitle(CreditCard, 'Payment guidelines')}
                    <ul className="space-y-2 text-sm text-[#3A2E1F]/80">
                        {payments.map(([label, text]) => (
                            <li key={label}><span className="font-bold text-[#3A2E1F]">{label}: </span>{text}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-[#3A2E1F]/60 mt-3">
                        Available options are shown at checkout. For online (non-COD) payments, the
                        team verifies your uploaded receipt before the order is processed.
                    </p>
                </section>

                {/* 9. Shipping */}
                <section>
                    {sectionTitle(Truck, 'Shipping & delivery guidelines')}
                    <ul className="space-y-2 text-sm text-[#3A2E1F]/80">
                        <li><span className="font-bold text-[#3A2E1F]">Delivery areas:</span> nationwide across Pakistan.</li>
                        <li><span className="font-bold text-[#3A2E1F]">Processing &amp; delivery time:</span> see the <Link to="/shipping" className="text-[#D97706] font-semibold hover:underline">Shipping page</Link> for current timing.</li>
                        <li><span className="font-bold text-[#3A2E1F]">Shipping charges:</span> shown at checkout and on the Shipping page. [VERIFY THIS]</li>
                        <li><span className="font-bold text-[#3A2E1F]">Tracking:</span> follow your order from the <Link to="/track-order" className="text-[#D97706] font-semibold hover:underline">Track Order</Link> page using your Order ID and phone number.</li>
                        <li><span className="font-bold text-[#3A2E1F]">Damaged or incorrect delivery:</span> contact support promptly — see the returns policy below.</li>
                    </ul>
                </section>

                {/* 10. Quality & sourcing */}
                <section>
                    {sectionTitle(Leaf, 'Product quality & sourcing')}
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                        {storeName} sources dry fruits and nuts from Gilgit-Baltistan and northern
                        Pakistan, working directly with growers, and hand-sorts batches before
                        packing. Some varieties are sourced from other regions, so the specific
                        origin and processing for each item are described on its product page rather
                        than generalised here. Where you need certified details for a particular
                        product, please [VERIFY THIS] with customer support.
                    </p>
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed mt-2">
                        Learn more on the <Link to="/about" className="text-[#D97706] font-semibold hover:underline">About page</Link> and the
                        {' '}<Link to="/dry-fruits-gilgit-baltistan" className="text-[#D97706] font-semibold hover:underline">Gilgit-Baltistan</Link> region guide.
                    </p>
                </section>

                {/* 11. Customer guidelines */}
                <section>
                    {sectionTitle(ClipboardCheck, 'Customer guidelines')}
                    <ul className="space-y-2 text-sm text-[#3A2E1F]/80">
                        <li>Read the product information and weight option before ordering.</li>
                        <li>Provide accurate delivery details so your order reaches you without delay.</li>
                        <li>Check the package when it arrives and confirm the seal is intact.</li>
                        <li>Store products correctly and follow any instructions on the packaging.</li>
                        <li>Contact customer support promptly if anything is wrong with your order.</li>
                    </ul>
                </section>

                {/* 12. Returns / refunds */}
                <section>
                    {sectionTitle(RotateCcw, 'Returns & refunds')}
                    <p className="text-sm text-[#3A2E1F]/80 leading-relaxed">
                        If there is a genuine issue with your order — such as a damaged, incorrect or
                        spoiled product — contact customer support with photos as soon as possible.
                        The full eligibility rules, timelines and steps are set out in the
                        {' '}<Link to="/privacy?tab=refund" className="text-[#D97706] font-semibold hover:underline">Return &amp; Refund Policy</Link>.
                    </p>
                    <p className="text-xs text-[#3A2E1F]/60 mt-2">
                        Exact return window and refund timelines: see the policy page. [ADD ACTUAL RETURN &amp; REFUND POLICY]
                    </p>
                </section>

                {/* 13. FAQ */}
                <section>
                    {sectionTitle(HelpCircle, 'Frequently asked questions')}
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <details key={i} className="group bg-white border border-[#E8DEC8] rounded-xl px-5 py-4">
                                <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-sm text-[#3A2E1F]">
                                    <span>{f.q}</span>
                                    <ArrowRight className="w-4 h-4 text-[#D97706] transition-transform group-open:rotate-90 shrink-0 ml-3" />
                                </summary>
                                <p className="text-xs text-[#3A2E1F]/80 mt-3 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Related pages */}
                <section>
                    {sectionTitle(ArrowRight, 'Related pages')}
                    <ul className="flex flex-wrap gap-x-4 gap-y-2.5 text-sm">
                        {relatedLinks.map((l) => (
                            <li key={l.to}>
                                <Link to={l.to} className="text-[#D97706] font-semibold hover:underline">{l.label}</Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
