import React, { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, RefreshCw, MessageSquare, Filter } from 'lucide-react';
import { ConfirmDialog, AdminEmptyState, AdminSkeletonTable } from '../../components/admin/AdminComponents';
import api from '../../api/api';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating, size = 'sm' }) => {
    const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`${sz} ${s <= rating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E8DEC8]'}`} />
            ))}
        </div>
    );
};

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | pending | approved
    const [deleteReview, setDeleteReview] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const loadReviews = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/reviews/admin');
            setReviews(res.data);
        } catch {
            toast.error('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadReviews(); }, []);

    const handleApprove = async (id, approve) => {
        setActionLoading(id);
        try {
            await api.patch(`/reviews/${id}`, { is_approved: approve ? 1 : 0 });
            toast.success(approve ? 'Review approved' : 'Review rejected');
            loadReviews();
        } catch {
            toast.error('Failed to update review');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteReview) return;
        try {
            await api.delete(`/reviews/${deleteReview.id}`);
            toast.success('Review deleted');
            loadReviews();
        } catch {
            toast.error('Failed to delete review');
        } finally {
            setDeleteReview(null);
        }
    };

    const filtered = reviews.filter(r => {
        if (filter === 'pending') return r.is_approved === 0;
        if (filter === 'approved') return r.is_approved === 1;
        return true;
    });

    const pendingCount = reviews.filter(r => r.is_approved === 0).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F] flex items-center gap-3">
                        Product Reviews
                        {pendingCount > 0 && (
                            <span className="text-sm font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                                {pendingCount} pending
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-[#3A2E1F]/70">Moderate customer reviews before they appear on the storefront</p>
                </div>
                <button type="button" onClick={loadReviews}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#FFFDF9] border border-[#E8DEC8] hover:bg-[#F5EFE0] text-[#3A2E1F] transition-all">
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : 'text-[#D97706]'}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* FILTER TABS */}
            <div className="flex items-center gap-2 bg-[#F5EFE0] rounded-2xl p-1.5 w-fit">
                {[
                    { key: 'all', label: `All (${reviews.length})` },
                    { key: 'pending', label: `Pending (${pendingCount})` },
                    { key: 'approved', label: `Approved (${reviews.length - pendingCount})` },
                ].map(t => (
                    <button key={t.key} type="button" onClick={() => setFilter(t.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === t.key ? 'bg-white text-[#3A2E1F] shadow-sm' : 'text-[#3A2E1F]/60 hover:text-[#3A2E1F]'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TABLE */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-8"><AdminSkeletonTable rows={5} /></div>
                ) : filtered.length === 0 ? (
                    <AdminEmptyState title="No Reviews" description="No reviews match the selected filter." />
                ) : (
                    <div className="divide-y divide-[#E8DEC8]/60">
                        {filtered.map(r => (
                            <div key={r.id} className={`p-5 flex flex-col sm:flex-row gap-4 hover:bg-[#F5EFE0]/30 transition-colors ${r.is_approved === 0 ? 'border-l-4 border-amber-400' : 'border-l-4 border-emerald-400'}`}>
                                {/* Left: customer + product */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-sm text-[#3A2E1F]">{r.customer_name}</span>
                                        {r.customer_email && <span className="text-[11px] text-[#3A2E1F]/50">{r.customer_email}</span>}
                                        <StarDisplay rating={r.rating} />
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.is_approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {r.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-[#D97706] font-bold">
                                        Product: {r.product_name || 'Unknown'}
                                    </div>
                                    {r.title && <p className="text-sm font-bold text-[#3A2E1F]">"{r.title}"</p>}
                                    {r.comment && <p className="text-xs text-[#3A2E1F]/70 leading-relaxed">{r.comment}</p>}
                                    <p className="text-[10px] text-[#3A2E1F]/40">{new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>

                                {/* Right: actions */}
                                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                                    {r.is_approved === 0 ? (
                                        <button type="button" onClick={() => handleApprove(r.id, true)} disabled={actionLoading === r.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                                            <Check className="w-3.5 h-3.5" /> Approve
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => handleApprove(r.id, false)} disabled={actionLoading === r.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                                            <X className="w-3.5 h-3.5" /> Unapprove
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setDeleteReview(r)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold rounded-xl transition-colors border border-rose-200">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog isOpen={!!deleteReview} onClose={() => setDeleteReview(null)}
                onConfirm={handleDelete} title="Delete Review"
                message={`Delete this review by ${deleteReview?.customer_name}?`}
                warningNote="This will permanently remove the review and recalculate the product rating." />
        </div>
    );
}
