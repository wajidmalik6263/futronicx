import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown,
    ChevronUp,
    RefreshCw,
    User,
    Phone,
    MapPin,
    Package,
    Clock,
    CheckCircle2,
    Truck,
    AlertCircle,
    MessageCircle,
    CreditCard,
    ShieldCheck,
    ShieldX,
    Image as ImageIcon
} from 'lucide-react';
import {
    StatusBadge,
    SlideOver,
    AdminEmptyState,
    AdminSkeletonTable
} from '../../components/admin/AdminComponents';
import { getOrders, updateOrderStatus } from '../../api/orders';
import { updatePaymentStatus } from '../../api/payments';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';
import toast from 'react-hot-toast';

export default function AdminOrders() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [orders, setOrders] = useState([]);
    const { settings } = useSettings();
    const { formatPrice } = useCurrency();
    const orderPrefix = settings.order_id_prefix || 'ORD';

    // SlideOver / Selected Order Detail State
    const [selectedOrder, setSelectedOrder] = useState(null);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // Real-time WebSocket updates
    const onNewOrder = useCallback((order) => {
        setOrders(prev => [order, ...prev]);
        toast.success(`🆕 New Order #${order.id} from ${order.customer_name}`, { duration: 5000, icon: '🛒' });
    }, []);

    const onStatusUpdate = useCallback((data) => {
        setOrders(prev => prev.map(o => o.id === data.id ? { ...o, status: data.status } : o));
        if (selectedOrder && selectedOrder.id === data.id) {
            setSelectedOrder(prev => prev ? { ...prev, status: data.status } : null);
        }
    }, [selectedOrder]);

    const onPaymentUpdate = useCallback((data) => {
        setOrders(prev => prev.map(o => o.id === data.id ? { ...o, payment_status: data.payment_status } : o));
        if (selectedOrder && selectedOrder.id === data.id) {
            setSelectedOrder(prev => prev ? { ...prev, payment_status: data.payment_status } : null);
        }
    }, [selectedOrder]);

    useAdminWebSocket({
        onNewOrder,
        onStatusUpdate,
        onPaymentUpdate
    });

    const tabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

    // Filter orders by active tab
    const filteredOrders = orders.filter(o => activeTab === 'All' || o.status === activeTab);

    const handleStatusChange = async (orderId, newStatus) => {
        // C12: Confirm before cancelling — this is irreversible
        if (newStatus === 'Cancelled') {
            const confirmed = window.confirm(
                `⚠️ Are you sure you want to cancel Order ${orderPrefix}-${orderId}?\n\nThis will restore stock for all items and cannot be undone.`
            );
            if (!confirmed) return;
        }

        try {
            const result = await updateOrderStatus(orderId, newStatus);
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            toast.success(`Order ${orderId} marked as ${newStatus}`);

            // Show WhatsApp notification button if link available
            if (result.whatsappLink) {
                toast(
                    (t) => (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold">Notify customer on WhatsApp?</span>
                            <a
                                href={result.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => toast.dismiss(t.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold rounded-full transition-colors"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Send
                            </a>
                        </div>
                    ),
                    { duration: 10000, icon: '💬' }
                );
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update order status");
        }
    };

    const handlePaymentAction = async (orderId, status) => {
        try {
            await updatePaymentStatus(orderId, status);
            setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: status } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, payment_status: status });
            }
            toast.success(`Payment ${status === 'Verified' ? 'verified' : 'rejected'} for Order ${orderPrefix}-${orderId}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update payment status');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">
                        Order Fulfillment
                    </h1>
                    <p className="text-xs text-[#3A2E1F]/70">
                        Track, inspect, and update customer order status
                    </p>
                </div>

                {/* Refresh Data Toggle */}
                <button
                    type="button"
                    onClick={loadOrders}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#FFFDF9] border border-[#E8DEC8] hover:bg-[#F5EFE0] text-[#3A2E1F] transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : 'text-[#D97706]'}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* STATUS TABS BAR */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E8DEC8]">
                {tabs.map((tab) => {
                    const count = tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length;
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0
                                ${isActive
                                    ? 'bg-[#F5A623] text-[#3A2E1F] shadow-sm'
                                    : 'bg-[#FFFDF9] text-[#3A2E1F]/70 border border-[#E8DEC8] hover:bg-[#F5EFE0]'
                                }
                            `}
                        >
                            <span>{tab}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-[#3A2E1F] text-white' : 'bg-[#F5EFE0] text-[#D97706]'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* DATA TABLE */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

                {isLoading ? (
                    <AdminSkeletonTable rows={6} />
                ) : filteredOrders.length === 0 ? (
                    <AdminEmptyState
                        title={`No ${activeTab} Orders`}
                        description={`There are currently no orders under "${activeTab}" status.`}
                        actionLabel="View All Orders"
                        onAction={() => setActiveTab('All')}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E8DEC8] text-[11px] font-bold uppercase tracking-wider text-[#3A2E1F]/60">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Payment</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8DEC8]/60 text-xs font-semibold text-[#3A2E1F]">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-[#F5EFE0]/40 transition-colors cursor-pointer"
                                    >
                                        <td className="py-4 px-4 font-mono font-bold text-[#D97706]">
                                            {orderPrefix}-{order.id}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-[#3A2E1F]">
                                            {order.customer_name}
                                        </td>
                                        <td className="py-4 px-4 font-extrabold text-sm text-[#3A2E1F]">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-[#3A2E1F]/60 uppercase">{order.payment_method || 'COD'}</span>
                                                {order.payment_method !== 'COD' && order.payment_status && (
                                                    <PaymentStatusBadge status={order.payment_status} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="py-4 px-4 text-[#3A2E1F]/60 text-[11px]">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button
                                                type="button"
                                                className="px-3 py-1.5 bg-[#F5EFE0] hover:bg-[#F5A623] text-[#3A2E1F] font-bold text-[11px] rounded-full transition-colors inline-flex items-center gap-1"
                                            >
                                                <span>Inspect</span>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ORDER INSPECTION SLIDE-OVER */}
            <SlideOver
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Order Details: ${orderPrefix}-${selectedOrder?.id}`}
            >
                {selectedOrder && (
                    <div className="space-y-8">

                        {/* Quick Status Control Header */}
                        <div className="p-4 bg-[#F5EFE0] rounded-2xl border border-[#E8DEC8] flex items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A2E1F]/60 block">Update Order Status</span>
                                <span className="text-xs font-bold text-[#3A2E1F] flex items-center gap-2 mt-1">Current: <StatusBadge status={selectedOrder.status} /></span>
                            </div>
                            <select
                                value={selectedOrder.status}
                                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                className="bg-white border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs font-bold text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] cursor-pointer"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Customer Details Box */}
                        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-5 space-y-3">
                            <h4 className="font-heading font-bold text-sm text-[#3A2E1F] border-b border-[#E8DEC8] pb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-[#D97706]" /> Customer Delivery Address
                            </h4>
                            <div className="space-y-1.5 text-xs text-[#3A2E1F]/80">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-[#3A2E1F]">Name:</span>
                                    <span className="font-bold">{selectedOrder.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-[#3A2E1F]">Phone:</span>
                                    <span className="font-mono">{selectedOrder.phone}</span>
                                </div>
                                {selectedOrder.customer_email && (
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-[#3A2E1F]">Email:</span>
                                        <span className="text-[#D97706]">{selectedOrder.customer_email}</span>
                                    </div>
                                )}
                                <div className="flex flex-col pt-1">
                                    <span className="font-semibold text-[#3A2E1F]">Address:</span>
                                    <span className="text-[#3A2E1F]/70 leading-relaxed mt-0.5">{selectedOrder.address}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        {selectedOrder.payment_method !== 'COD' && (
                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-5 space-y-3">
                                <h4 className="font-heading font-bold text-sm text-[#3A2E1F] border-b border-[#E8DEC8] pb-2 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#D97706]" /> Payment Verification
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-[#3A2E1F]">Method:</span>
                                        <span className="font-bold uppercase">{selectedOrder.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-[#3A2E1F]">Status:</span>
                                        <PaymentStatusBadge status={selectedOrder.payment_status} />
                                    </div>
                                </div>
                                {selectedOrder.payment_proof && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-[#3A2E1F]/60 uppercase block">Payment Receipt</span>
                                        <a href={selectedOrder.payment_proof} target="_blank" rel="noopener noreferrer" className="block">
                                            <img src={selectedOrder.payment_proof} alt="Payment receipt" className="w-full max-h-40 object-contain rounded-xl border border-[#E8DEC8] bg-white hover:border-[#F5A623] transition-colors cursor-pointer" />
                                        </a>
                                    </div>
                                )}
                                {selectedOrder.payment_status !== 'Verified' && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handlePaymentAction(selectedOrder.id, 'Verified')}
                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" /> Verify Payment
                                        </button>
                                        {selectedOrder.payment_status !== 'Rejected' && (
                                            <button
                                                onClick={() => handlePaymentAction(selectedOrder.id, 'Rejected')}
                                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <ShieldX className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ordered Items Breakdown */}
                        <div className="space-y-3">
                            <h4 className="font-heading font-bold text-sm text-[#3A2E1F] flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#D97706]" /> Ordered Line Items ({selectedOrder.items?.length || 0})
                            </h4>

                            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl divide-y divide-[#E8DEC8]/60 overflow-hidden">
                                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex flex-col gap-1 text-xs">
                                        <div className="flex justify-between items-start">
                                            <h5 className="font-bold text-[#3A2E1F] line-clamp-1">{item.product_name}</h5>
                                            <div className="text-right font-extrabold text-[#3A2E1F] whitespace-nowrap ml-4">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-[#D97706] font-semibold">
                                            {item.weight_option} × {item.quantity} units ({formatPrice(item.price)} each)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Total Summary */}
                        <div className="p-4 bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl space-y-2 text-xs">
                            <div className="flex justify-between text-[#3A2E1F]/70">
                                <span>Subtotal</span>
                                <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                            </div>
                            <div className="flex justify-between text-[#3A2E1F]/70">
                                <span>Shipping Fee ({selectedOrder.payment_method || 'COD'})</span>
                                <span className={`font-bold ${(selectedOrder.shipping_fee || 0) === 0 ? 'text-emerald-700' : 'text-[#3A2E1F]'}`}>
                                    {(selectedOrder.shipping_fee || 0) === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_fee)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[#E8DEC8] flex justify-between items-baseline">
                                <span className="font-heading font-bold text-sm text-[#3A2E1F]">Grand Total</span>
                                <span className="font-heading font-extrabold text-xl text-[#3A2E1F]">{formatPrice(selectedOrder.total)}</span>
                            </div>
                        </div>

                    </div>
                )}
            </SlideOver>

        </div>
    );
}

function PaymentStatusBadge({ status }) {
    const styles = {
        'Unpaid': 'bg-gray-100 text-gray-700 border-gray-300',
        'Pending Verification': 'bg-amber-100 text-amber-800 border-amber-300',
        'Verified': 'bg-emerald-100 text-emerald-800 border-emerald-300',
        'Rejected': 'bg-rose-100 text-rose-800 border-rose-300',
    };
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${styles[status] || styles['Unpaid']}`}>
            {status || 'Unpaid'}
        </span>
    );
}
