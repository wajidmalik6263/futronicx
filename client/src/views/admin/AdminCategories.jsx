import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Trash2,
    RefreshCw,
    Package,
    Edit3,
    Loader2,
    Camera,
    X,
    ImageOff,
    FileDown
} from 'lucide-react';
import {
    Modal,
    ConfirmDialog,
    AdminEmptyState,
    AdminSkeletonTable
} from '../../components/admin/AdminComponents';
import { getCategories, createCategory, deleteCategory, updateCategory } from '../../api/categories';
import api from '../../api/api';
import toast from 'react-hot-toast';
import BulkImportModal from '../../components/admin/BulkImportModal';

export default function AdminCategories() {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editCat, setEditCat] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Delete dialog state
    const [deleteCat, setDeleteCat] = useState(null);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

    // Auto-generate Slug helper
    const autoSlug = categoryName
        ? categoryName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
        : '';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkImport = async (rows) => {
        const res = await api.post('/categories/bulk-import', { categories: rows });
        toast.success(`Imported ${res.data.imported} category/categories`);
        loadData();
        return res.data;
    };

    useEffect(() => { loadData(); }, []);

    const openAddModal = () => {
        setEditCat(null);
        setCategoryName('');
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        setIsModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditCat(cat);
        setCategoryName(cat.name);
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(cat.image_url || null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setExistingImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName) return;
        setIsSubmitting(true);
        try {
            let imageUrl = existingImageUrl;

            // Upload new image if selected
            if (imageFile) {
                const fd = new FormData();
                fd.append('image', imageFile);
                const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                imageUrl = res.data.url;
            }

            const payload = {
                name: categoryName,
                slug: autoSlug || 'new-category',
                image_url: imageUrl || null
            };

            if (editCat) {
                await updateCategory(editCat.id, payload);
                toast.success('Category updated');
            } else {
                await createCategory(payload);
                toast.success('Category created');
            }

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || `Failed to ${editCat ? 'update' : 'create'} category`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCat) return;
        try {
            await deleteCategory(deleteCat.id);
            toast.success('Category deleted');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete category');
        } finally {
            setDeleteCat(null);
        }
    };

    const displayImage = imagePreview || existingImageUrl;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">
                        Category Management
                    </h1>
                    <p className="text-xs text-[#3A2E1F]/70">
                        Organize storefront taxonomy and product classifications
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={loadData}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#FFFDF9] border border-[#E8DEC8] hover:bg-[#F5EFE0] text-[#3A2E1F] transition-all">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : 'text-[#D97706]'}`} />
                        <span>Refresh</span>
                    </button>
                    <button type="button" onClick={() => setIsBulkImportOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3A2E1F] hover:bg-[#D97706] text-white font-extrabold text-xs rounded-full shadow-md transition-all">
                        <FileDown className="w-4 h-4" />
                        <span>Import CSV</span>
                    </button>
                    <button type="button" onClick={openAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-extrabold text-xs rounded-full shadow-md transition-all">
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                    </button>
                </div>
            </div>

            {/* CATEGORY GRID */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-48 bg-[#F5EFE0] rounded-3xl" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <AdminEmptyState
                    title="No Categories Available"
                    description="Click 'Add Category' above to create your first product category."
                    actionLabel="Create Category"
                    onAction={openAddModal}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {categories.map((cat) => (
                        <div key={cat.id}
                            className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">

                            {/* Category Image / Icon */}
                            <div className="relative h-36 bg-[#F5EFE0] overflow-hidden">
                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center ${cat.image_url ? 'hidden' : 'flex'}`}>
                                    <span className="text-5xl">{cat.icon || '📦'}</span>
                                </div>
                                {/* Action buttons overlay */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => openEditModal(cat)}
                                        className="p-1.5 bg-white/90 hover:bg-[#F5A623] text-[#3A2E1F] rounded-xl shadow-sm transition-colors">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => setDeleteCat(cat)}
                                        className="p-1.5 bg-white/90 hover:bg-rose-500 hover:text-white text-rose-600 rounded-xl shadow-sm transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Category Info */}
                            <div className="p-4 space-y-1 flex-1">
                                <h3 className="font-heading font-bold text-base text-[#3A2E1F]">{cat.name}</h3>
                                <span className="text-[11px] font-mono text-[#D97706] block">/{cat.slug}</span>
                            </div>

                            <div className="px-4 pb-4 border-t border-[#E8DEC8] pt-3 flex items-center justify-between text-xs font-semibold text-[#3A2E1F]/70">
                                <span className="flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-[#D97706]" />
                                    <span>{cat.productCount || 0} Products</span>
                                </span>
                                {cat.image_url
                                    ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Has Image</span>
                                    : <span className="text-[10px] font-bold text-[#3A2E1F]/40 bg-[#F5EFE0] px-2 py-0.5 rounded-full">Icon Fallback</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editCat ? 'Edit Category' : 'Add New Category'}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Category Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                            Category Name
                        </label>
                        <input
                            required
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="e.g. Premium Nuts"
                            className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                        />
                    </div>

                    {/* Slug Preview */}
                    <div className="p-3 bg-[#F5EFE0] rounded-2xl border border-[#E8DEC8]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A2E1F]/60 block">URL Slug:</span>
                        <code className="text-xs font-mono font-bold text-[#D97706]">/category/{autoSlug || 'your-category-slug'}</code>
                    </div>

                    {/* Category Image */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                            Category Image <span className="text-[#3A2E1F]/40 font-normal normal-case">(optional — icon used as fallback)</span>
                        </label>

                        {displayImage ? (
                            <div className="relative group">
                                <img
                                    src={displayImage}
                                    alt="Category preview"
                                    className="w-full h-40 object-cover rounded-2xl border border-[#E8DEC8]"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-[#3A2E1F]/50">
                                        {imageFile ? imageFile.name : 'Current image'}
                                    </span>
                                    <label className="text-[10px] font-bold text-[#D97706] cursor-pointer hover:underline">
                                        Change Image
                                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="sr-only" />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#E8DEC8] hover:border-[#F5A623] rounded-2xl p-8 cursor-pointer transition-all hover:bg-[#F5A623]/5 group">
                                <div className="w-14 h-14 rounded-2xl bg-[#F5EFE0] group-hover:bg-[#F5A623]/20 flex items-center justify-center transition-colors">
                                    <Camera className="w-7 h-7 text-[#D97706]" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-bold text-[#3A2E1F] block">Click to upload image</span>
                                    <span className="text-[11px] text-[#3A2E1F]/50">PNG, JPG, WebP • max 5MB • recommended 600×400px</span>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="sr-only" />
                            </label>
                        )}
                    </div>

                    <div className="pt-4 border-t border-[#E8DEC8] flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                            className="w-1/2 py-2.5 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="w-1/2 flex items-center justify-center gap-2 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full transition-colors shadow-md disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            <span>{editCat ? 'Update Category' : 'Save Category'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                isOpen={!!deleteCat}
                onClose={() => setDeleteCat(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteCat?.name}"?`}
                warningNote={
                    deleteCat?.productCount > 0
                        ? `Warning: This category has ${deleteCat.productCount} linked products. They will become uncategorized.`
                        : null
                }
            />

            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                mode="categories"
                onImport={handleBulkImport}
            />
        </div>
    );
}
