import React, { useState, useCallback } from 'react';
import {
    ShoppingBag,
    DollarSign,
    Package,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    Truck,
    RefreshCw,
    Eye,
    Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../api/orders';
import { getProducts } from '../../api/products';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [ordersData, productsData] = await Promise.all([
                    getOrders(),
                    getProducts()
                ]);

                // Calculate stats
                const totalOrders = ordersData.length;
                const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
                const totalProducts = productsData.length;
                const lowStockCount = productsData.filter(p => p.stock < 5).length;

                setStats([
                    { title: 'Total Orders', value: totalOrders.toString(), change: 'Lifetime total', isPositive: true, icon: ShoppingBag, color: 'bg-[#F5A623]/20 text-[#D97706]' },
                    { title: 'Total Revenue', value: formatPrice(totalRevenue), change: 'Lifetime gross', isPositive: true, icon: DollarSign, color: 'bg-emerald-100 text-emerald-700' },
                    { title: 'Total Products', value: totalProducts.toString(), change: 'Active in catalog', isPositive: true, icon: Package, color: 'bg-blue-100 text-blue-700' },
                    { title: 'Low Stock Alert', value: `${lowStockCount} Items`, change: lowStockCount > 0 ? 'Action needed' : 'Stock healthy', isPositive: lowStockCount === 0, icon: AlertTriangle, color: lowStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700' },
                ]);

                // Map recent 5 orders
                const latest5 = ordersData.slice(0, 5).map(o => ({
                    id: `${settings.order_id_prefix || 'ORD'}-${o.id}`,
                    customer: o.customer_name,
                    total: formatPrice(o.total),
                    status: o.status,
                    date: new Date(o.created_at).toLocaleDateString()
                }));
                setRecentOrders(latest5);
            } catch (err) {
                toast.error('Failed to load dashboard data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Real-time: refresh dashboard when a new order arrives
    const onNewOrder = useCallback((order) => {
        toast.success(`🆕 New Order #${order.id} from ${order.customer_name}`, { duration: 5000, icon: '🛒' });
        // Re-fetch stats to update totals
        Promise.all([getOrders(), getProducts()]).then(([ordersData, productsData]) => {
            const totalOrders = ordersData.length;
            const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
            const totalProducts = productsData.length;
            const lowStockCount = productsData.filter(p => p.stock < 5).length;
            setStats([
                { title: 'Total Orders', value: totalOrders.toString(), change: 'Lifetime total', isPositive: true, icon: ShoppingBag, color: 'bg-[#F5A623]/20 text-[#D97706]' },
                { title: 'Total Revenue', value: formatPrice(totalRevenue), change: 'Lifetime gross', isPositive: true, icon: DollarSign, color: 'bg-emerald-100 text-emerald-700' },
                { title: 'Total Products', value: totalProducts.toString(), change: 'Active in catalog', isPositive: true, icon: Package, color: 'bg-blue-100 text-blue-700' },
                { title: 'Low Stock Alert', value: `${lowStockCount} Items`, change: lowStockCount > 0 ? 'Action needed' : 'Stock healthy', isPositive: lowStockCount === 0, icon: AlertTriangle, color: lowStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700' },
            ]);
            const latest5 = ordersData.slice(0, 5).map(o => ({
                id: `${settings.order_id_prefix || 'ORD'}-${o.id}`,
                customer: o.customer_name,
                total: formatPrice(o.total),
                status: o.status,
                date: new Date(o.created_at).toLocaleDateString()
            }));
            setRecentOrders(latest5);
        }).catch(() => { });
    }, [formatPrice, settings.order_id_prefix]);

    useAdminWebSocket({ onNewOrder });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'Processing':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Shipped':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'Delivered':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* HEADER & LOADING SKELETON TOGGLE */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">
                        Store Overview
                    </h1>
                    <p className="text-xs text-[#3A2E1F]/70">
                        Real-time metrics and order activity from your {settings.store_name || 'North Dry Fruits'} store
                    </p>
                </div>

                {isLoading && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border bg-[#FFFDF9] text-[#3A2E1F] border-[#E8DEC8]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F5A623]" />
                        <span>Syncing Data...</span>
                    </div>
                )}
            </div>

            {/* 1. STAT CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {isLoading
                    ? [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-[#E8DEC8] rounded w-1/2"></div>
                                <div className="w-10 h-10 bg-[#F5EFE0] rounded-2xl"></div>
                            </div>
                            <div className="h-8 bg-[#E8DEC8] rounded w-3/4"></div>
                            <div className="h-3 bg-[#E8DEC8] rounded w-1/3"></div>
                        </div>
                    ))
                    : stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#3A2E1F]/70 uppercase tracking-wider">
                                        {stat.title}
                                    </span>
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>

                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">
                                        {stat.value}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                                        {stat.isPositive ? (
                                            <span className="text-emerald-700 flex items-center gap-0.5">
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                {stat.change}
                                            </span>
                                        ) : (
                                            <span className="text-rose-700 flex items-center gap-0.5">
                                                <ArrowDownRight className="w-3.5 h-3.5" />
                                                {stat.change}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* 2. RECENT ORDERS TABLE */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-4">
                    <div>
                        <h2 className="font-heading font-bold text-xl text-[#3A2E1F]">Recent Orders</h2>
                        <p className="text-xs text-[#3A2E1F]/60">Latest transactions placed across the storefront</p>
                    </div>
                    <span className="text-xs font-bold text-[#D97706] bg-[#F5EFE0] px-3 py-1 rounded-full border border-[#E8DEC8]">
                        5 Most Recent
                    </span>
                </div>

                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-[#F5EFE0] rounded-2xl w-full"></div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E8DEC8] text-[11px] font-bold uppercase tracking-wider text-[#3A2E1F]/60">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer Name</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8DEC8]/60 text-xs font-semibold text-[#3A2E1F]">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-[#F5EFE0]/40 transition-colors">
                                        <td className="py-4 px-4 font-mono font-bold text-[#D97706]">
                                            {order.id}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-[#3A2E1F]">
                                            {order.customer}
                                        </td>
                                        <td className="py-4 px-4 text-[#3A2E1F]/70">
                                            {order.date}
                                        </td>
                                        <td className="py-4 px-4 font-extrabold">
                                            {order.total}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/admin/orders')}
                                                className="p-1.5 bg-[#F5EFE0] hover:bg-[#F5A623] text-[#3A2E1F] rounded-xl transition-colors inline-flex items-center justify-center"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
