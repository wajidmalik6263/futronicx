import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard';
import { ProductSkeleton } from '../Skeletons';
import { getProducts } from '../../api/products';

export default function ProductGrid({ config }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const heading = config?.heading || 'Products';
    const badge = config?.badge || '';
    const filter = config?.filter || 'all';
    const maxItems = Math.max(config?.maxItems || 8, 8);
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
                console.error('ProductGrid fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, maxItems, categorySlug]);

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
                {badge && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623] text-[#3A2E1F] text-xs font-bold uppercase tracking-wider">
                        <Award className="w-4 h-4" />
                        <span>{badge}</span>
                    </div>
                )}
                <h2 className="text-2xl sm:text-4xl font-extrabold font-body text-[#3A2E1F]">{heading}</h2>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[...Array(maxItems)].map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {products.map((prod) => (
                        <div key={prod.id} className="h-full">
                            <ProductCard product={{
                                ...prod,
                                category: prod.category_name || prod.category_slug,
                                images: [prod.image_url],
                                weightOptions: prod.weight_options
                            }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-[#3A2E1F]/60">No products found.</div>
            )}

            {/* View All Products Button */}
            <div className="text-center pt-4">
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                    <span>View All Products</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </section>
    );
}
