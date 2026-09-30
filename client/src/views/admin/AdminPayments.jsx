import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, CreditCard, Smartphone, Building2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { Modal, ConfirmDialog, AdminEmptyState, AdminSkeletonTable } from '../../components/admin/AdminComponents';
import { getPaymentAccountsAdmin, createPaymentAccount, updatePaymentAccount, deletePaymentAccount } from '../../api/payments';
import toast from 'react-hot-toast';

const METHOD_OPTIONS = [
    { value: 'easypaisa', label: 'Easypaisa', icon: Smartphone, color: '#4CAF50' },
    { value: 'jazzcash', label: 'JazzCash', icon: Smartphone, color: '#E4002B' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: '#1565C0' },
];

const getMethodInfo = (method) => METHOD_OPTIONS.find(m => m.value === method) || { label: method, icon: CreditCard, color: '#D97706' };

export default function AdminPayments() {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        method: 'easypaisa',
        title: '',
        account_number: '',
        account_name: '',
        instructions: '',
        is_active: 1
    });

    const loadAccounts = async () => {
        setIsLoading(true);
        try {
            const data = await getPaymentAccountsAdmin();
            setAccounts(data);
        } catch {
            toast.error('Failed to load payment accounts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadAccounts(); }, []);

    const openAddModal = () => {
        setEditingAccount(null);
        setFormData({ method: 'easypaisa', title: '', account_number: '', account_name: '', instructions: '', is_active: 1 });
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setFormData({
            method: account.method,
            title: account.title,
            account_number: account.account_number,
            account_name: account.account_name,
            instructions: account.instructions || '',
            is_active: account.is_active
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.account_number || !formData.account_name) {
            toast.error('Title, account number, and account name are required');
            return;
        }
        try {
            if (editingAccount) {
                await updatePaymentAccount(editingAccount.id, formData);
                toast.success('Payment account updated');
            } else {
                await createPaymentAccount(formData);
                toast.success('Payment account added');
            }
            setIsModalOpen(false);
            loadAccounts();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save payment account');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deletePaymentAccount(deleteTarget.id);
            toast.success('Payment account removed');
            setDeleteTarget(null);
            loadAccounts();
        } catch {
            toast.error('Failed to delete payment account');
        }
    };

    const toggleActive = async (account) => {
        try {
            await updatePaymentAccount(account.id, { ...account, is_active: account.is_active ? 0 : 1 });
            toast.success(`${account.title} ${account.is_active ? 'disabled' : 'enabled'}`);
            loadAccounts();
        } catch {
            toast.error('Failed to toggle status');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">Payment Accounts</h1>
                    <p className="text-xs text-[#3A2E1F]/70">Manage your online payment accounts for customer checkout</p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={loadAccounts} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#FFFDF9] border border-[#E8DEC8] hover:bg-[#F5EFE0] text-[#3A2E1F] transition-all">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : 'text-[#D97706]'}`} />
                        <span>Refresh</span>
                    </button>
                    <button type="button" onClick={openAddModal} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white transition-all shadow-sm">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Account</span>
                    </button>
                </div>
            </div>

            {/* ACCOUNTS TABLE */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm">
                {isLoading ? (
                    <AdminSkeletonTable rows={3} />
                ) : accounts.length === 0 ? (
                    <AdminEmptyState
                        title="No Payment Accounts"
                        description="Add your payment accounts so customers can pay online."
                        actionLabel="Add Payment Account"
                        onAction={openAddModal}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E8DEC8] text-[11px] font-bold uppercase tracking-wider text-[#3A2E1F]/60">
                                    <th className="py-3 px-4">Method</th>
                                    <th className="py-3 px-4">Title</th>
                                    <th className="py-3 px-4">Account Number</th>
                                    <th className="py-3 px-4">Account Name</th>
                                    <th className="py-3 px-4 text-center">Active</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8DEC8]/60 text-xs font-semibold text-[#3A2E1F]">
                                {accounts.map((account) => {
                                    const methodInfo = getMethodInfo(account.method);
                                    const Icon = methodInfo.icon;
                                    return (
                                        <tr key={account.id} className="hover:bg-[#F5EFE0]/40 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${methodInfo.color}15` }}>
                                                        <Icon className="w-4 h-4" style={{ color: methodInfo.color }} />
                                                    </div>
                                                    <span className="font-bold text-[#3A2E1F]">{methodInfo.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-bold">{account.title}</td>
                                            <td className="py-4 px-4 font-mono text-[#D97706]">{account.account_number}</td>
                                            <td className="py-4 px-4">{account.account_name}</td>
                                            <td className="py-4 px-4 text-center">
                                                <button onClick={() => toggleActive(account)} className="transition-colors">
                                                    {account.is_active ? (
                                                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <ToggleLeft className="w-6 h-6 text-[#3A2E1F]/30" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(account)} className="p-2 bg-[#F5EFE0] hover:bg-[#F5A623]/20 rounded-xl transition-colors">
                                                        <Pencil className="w-3.5 h-3.5 text-[#D97706]" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(account)} className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? 'Edit Payment Account' : 'Add Payment Account'} maxWidth="max-w-lg">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Payment Method</label>
                        <select
                            value={formData.method}
                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                        >
                            {METHOD_OPTIONS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Display Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] placeholder:text-[#3A2E1F]/40"
                            placeholder="e.g. Easypaisa - Main Account"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Account Number</label>
                            <input
                                type="text"
                                value={formData.account_number}
                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] placeholder:text-[#3A2E1F]/40 font-mono"
                                placeholder="Account Number"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Account Name</label>
                            <input
                                type="text"
                                value={formData.account_name}
                                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] placeholder:text-[#3A2E1F]/40"
                                placeholder="Account Holder Name"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Instructions <span className="text-[#3A2E1F]/40 font-normal normal-case">(shown to customers)</span></label>
                        <textarea
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            rows={3}
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] placeholder:text-[#3A2E1F]/40 resize-none"
                            placeholder="Send payment to the above number and upload the screenshot..."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC8]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSave} className="px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-sm transition-colors">
                            {editingAccount ? 'Update Account' : 'Add Account'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRM */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Payment Account"
                message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
                warningNote="Customers will no longer see this payment option at checkout."
                confirmText="Delete Account"
            />
        </div>
    );
}
