import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProducts } from '../../api/products';
import { useCurrency } from '../../hooks/useCurrency';
import LazyImage from '../LazyImage';

export default function ProductCarousel({ config }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { formatPrice } = useCurrency();

    const heading = config?.heading || 'Products';
    const badge = config?.badge || '';
    const description = config?.description || '';
    const filter = config?.filter || 'new';
    const maxItems = config?.maxItems || 8;
    const categorySlug = config?.categorySlug || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                let params = {};
                if (filter === 'featured') params.featured = 'true';
                if (filter === 'category' && categorySlug) params.category = categorySlug;

                const res = await getProducts(params);
                setProducts(res.slice(0, maxItems));
            } catch (err) {
                console.error('ProductCarousel fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, maxItems, categorySlug]);

    useEffect(() => {
        if (products.length === 0 || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % Math.ceil(products.length / 2));
        }, 4500);
        return () => clearInterval(interval);
    }, [products.length, isPaused]);

    // Fixed section height reserved in BOTH loading and loaded states so the
    // banner never grows once products arrive — this is what eliminates the
    // large downstream CLS (the banner used to expand past a min-h floor and
    // push every section below it down).
    const BANNER_HEIGHT = 'h-[360px] sm:h-[300px] lg:h-[260px]';

    if (loading) {
        return (
            <section className="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div className={`bg-[#F5EFE0]/40 border border-[#E8DEC8] rounded-3xl p-5 sm:p-8 animate-pulse ${BANNER_HEIGHT}`} />
            </section>
        );
    }

    if (products.length === 0) return null;

    const totalGroups = Math.ceil(products.length / 2);

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                className={`bg-gradient-to-r from-[#FFFDF9] via-[#F5EFE0]/40 to-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-5 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xs relative overflow-hidden ${BANNER_HEIGHT}`}
            >
                <div className="lg:max-w-xs space-y-2 sm:space-y-3 text-center lg:text-left shrink-0">
                    {badge && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D97706]/10 text-[#B45309] rounded-full text-xs font-bold uppercase tracking-wider border border-[#D97706]/30 shadow-xs">
                            <Flame className="w-4 h-4 fill-current animate-pulse" />
                            <span>{badge}</span>
                        </div>
                    )}
                    <h2 className="text-xl sm:text-2xl font-bold font-body text-[#3A2E1F]">{heading}</h2>
                    {description && (
                        <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">{description}</p>
                    )}
                    <div className="flex items-center justify-center lg:justify-start gap-4 pt-1">
                        <Link to="/products" className="inline-flex items-center gap-1 min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold text-[#B45309] hover:underline">
                            <span>View all</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-3 ml-2">
                            <button type="button" onClick={() => setCurrentIndex(prev => (prev === 0 ? totalGroups - 1 : prev - 1))} aria-label="Previous" className="w-11 h-11 rounded-full bg-white border border-[#E8DEC8] hover:bg-[#F5A623] hover:border-[#F5A623] text-[#3A2E1F] flex items-center justify-center transition-all shadow-xs">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setCurrentIndex(prev => (prev + 1) % totalGroups)} aria-label="Next" className="w-11 h-11 rounded-full bg-white border border-[#E8DEC8] hover:bg-[#F5A623] hover:border-[#F5A623] text-[#3A2E1F] flex items-center justify-center transition-all shadow-xs">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-hidden relative">
                    <div
                        className="flex transition-transform duration-500 ease-out gap-3 sm:gap-4"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {Array.from({ length: totalGroups }).map((_, groupIdx) => {
                            const groupItems = products.slice(groupIdx * 2, groupIdx * 2 + 2);
                            return (
                                <div key={groupIdx} className="w-full shrink-0 grid grid-cols-2 gap-4 sm:gap-4">
                                    {groupItems.map(item => (
                                        <Link
                                            key={item.id}
                                            to={`/product/${item.slug}`}
                                            className="group bg-[#FFFDF9] p-3 rounded-2xl border border-[#E8DEC8] hover:border-[#F5A623] hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center min-h-[135px] relative"
                                        >
                                            <LazyImage
                                                src={item.image_url || '/placeholder.png'}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                wrapperClassName="w-16 h-16 sm:w-20 sm:h-20 rounded-xl mb-2"
                                                rootMargin="200px"
                                                width={160}
                                                height={160}
                                            />
                                            <span className="text-xs font-bold text-[#3A2E1F] line-clamp-1 group-hover:text-[#D97706] transition-colors">{item.name}</span>
                                            <span className="text-xs font-extrabold text-[#B45309] mt-0.5">Starting from {formatPrice(item.base_price)}</span>
                                        </Link>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                    {totalGroups > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {Array.from({ length: totalGroups }).map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={() => setCurrentIndex(dotIdx)}
                                    className="group flex items-center justify-center h-8 w-8 shrink-0"
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                    aria-current={currentIndex === dotIdx ? 'true' : undefined}
                                >
                                    <span
                                        className={`block h-2 rounded-full transition-all duration-300 ${currentIndex === dotIdx ? 'w-6 bg-[#D97706]' : 'w-2 bg-[#E8DEC8] group-hover:bg-[#F5A623]'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
