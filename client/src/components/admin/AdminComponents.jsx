import React from 'react';
import { X, AlertTriangle, PackageX, CheckCircle, Info } from 'lucide-react';

// 1. Color-Coded Status Badge
export function StatusBadge({ status }) {
    const getBadgeStyle = (s) => {
        switch (s) {
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
        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${getBadgeStyle(status)}`}>
            {status}
        </span>
    );
}

// 2. Fullscreen Modal Dialog
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 flex flex-col">
            <div className="flex-1 flex flex-col bg-[#FFFDF9] rounded-2xl border border-[#E8DEC8] shadow-xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] px-6 sm:px-8 py-4 shrink-0">
                    <h3 className="font-heading font-bold text-xl text-[#3A2E1F]">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-[#3A2E1F]/60 hover:text-[#3A2E1F] rounded-full hover:bg-[#F5EFE0] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// 3. Fullscreen Panel (was Right Drawer)
export function SlideOver({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 flex flex-col">
            <div className="flex-1 flex flex-col bg-[#FFFDF9] rounded-2xl border border-[#E8DEC8] shadow-xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] px-6 sm:px-8 py-4 shrink-0">
                    <h3 className="font-heading font-bold text-2xl text-[#3A2E1F]">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-[#3A2E1F]/60 hover:text-[#3A2E1F] rounded-full hover:bg-[#F5EFE0] transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

// 4. Confirm Dialog Modal
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', warningNote }) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm text-rose-900">{message}</p>
                        {warningNote && <p className="text-rose-700 mt-1 leading-relaxed">{warningNote}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC8]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-sm transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// 5. Admin Empty State Component
export function AdminEmptyState({ title = 'No Data Found', description = 'There are no items matching your criteria.', actionLabel, onAction }) {
    return (
        <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 bg-[#F5EFE0] text-[#D97706] rounded-full flex items-center justify-center mx-auto border border-[#E8DEC8]">
                <PackageX className="w-8 h-8" />
            </div>
            <div className="space-y-1">
                <h3 className="font-heading font-bold text-xl text-[#3A2E1F]">{title}</h3>
                <p className="text-xs text-[#3A2E1F]/70">{description}</p>
            </div>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="px-6 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full transition-colors shadow-xs"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

// 6. Admin Table Skeleton Loader
export function AdminSkeletonTable({ rows = 5 }) {
    return (
        <div className="space-y-3 animate-pulse">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="h-14 bg-[#F5EFE0] rounded-2xl w-full" />
            ))}
        </div>
    );
}
