import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Plus, Search, Edit, Trash2, Check, X, UploadCloud,
    RefreshCw, ChevronLeft, ChevronRight, Sparkles,
    AlertCircle, Loader2, Images, GripVertical, Star, Tag, BadgePercent,
    FileDown
} from 'lucide-react';
import RichTextEditor from '../../components/admin/RichTextEditor';
import {
    SlideOver, ConfirmDialog, AdminEmptyState, AdminSkeletonTable
} from '../../components/admin/AdminComponents';
import BulkImportModal from '../../components/admin/BulkImportModal';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadImage } from '../../api/products';
import { getCategories } from '../../api/categories';
import { validateProductImage } from '../../utils/imageValidation';
import api from '../../api/api';
import { useCurrency } from '../../hooks/useCurrency';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
    name: '', category_id: '', basePrice: '', stock: '',
    rating: '4.8', reviewCount: '0', description: '', short_description: '',
    isFeatured: false, isNew: false,
    origin: '', shelfLife: '', storageInstructions: '',
    weightOptions: [{ label: '1kg', price: '', originalPrice: '' }, { label: '500g', price: '', originalPrice: '' }]
};

export default function AdminProducts() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { formatPrice } = useCurrency();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

    // Primary image
    const [primaryFile, setPrimaryFile] = useState(null);
    const [primaryPreview, setPrimaryPreview] = useState(null);
    const primaryInputRef = useRef(null);

    // Gallery images (up to 6 extra)
    const [galleryFiles, setGalleryFiles] = useState([]); // {file, preview, url}
    const galleryInputRef = useRef(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteProductItem, setDeleteProductItem] = useState(null);

    const handleBulkImport = async (rows) => {
        const res = await api.post('/products/bulk-import', { products: rows });
        toast.success(`Imported ${res.data.imported} product(s)`);
        loadData();
        return res.data;
    };

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
            setProducts(prods);
            setCategories(cats);
        } catch { toast.error('Failed to load products or categories'); }
        finally { setIsLoading(false); }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    const handleOpenForm = (prod = null) => {
        setPrimaryFile(null);
        setGalleryFiles([]);
        if (prod) {
            setEditingProduct(prod);
            setFormData({
                name: prod.name,
                category_id: prod.category_id || (categories.length > 0 ? categories[0].id : ''),
                basePrice: prod.base_price,
                stock: prod.stock,
                rating: prod.rating || 4.8,
                reviewCount: prod.review_count || 0,
                description: prod.description || '',
                short_description: prod.short_description || '',
                isFeatured: prod.is_featured === 1,
                isNew: prod.is_new === 1,
                origin: prod.origin || '',
                shelfLife: prod.shelf_life || '',
                storageInstructions: prod.storage_instructions || '',
                weightOptions: prod.weight_options?.length > 0
                    ? prod.weight_options.map(o => ({ label: o.label, price: o.price || '', originalPrice: o.originalPrice || '' }))
                    : [{ label: '500g', price: '', originalPrice: '' }]
            });
            setPrimaryPreview(prod.image_url || null);
            // Load existing gallery
            if (prod.gallery_images?.length > 0) {
                setGalleryFiles(prod.gallery_images.map(url => ({ file: null, preview: url, url })));
            }
        } else {
            setEditingProduct(null);
            setFormData({ ...EMPTY_FORM, category_id: categories.length > 0 ? categories[0].id : '' });
            setPrimaryPreview(null);
        }
        setIsFormOpen(true);
    };

    const handlePrimaryImageChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file after a rejection
        if (!file) return;

        const result = await validateProductImage(file);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        if (result.warning) toast(result.warning, { icon: '⚠️', duration: 6000 });

        if (primaryPreview?.startsWith('blob:')) URL.revokeObjectURL(primaryPreview);
        setPrimaryFile(file);
        setPrimaryPreview(URL.createObjectURL(file));
    };

    const handleGalleryAdd = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        const remaining = 6 - galleryFiles.length;
        if (remaining <= 0) { toast.error('Maximum 6 gallery images'); return; }

        const toAdd = [];
        for (const file of files.slice(0, remaining)) {
            const result = await validateProductImage(file);
            if (!result.ok) {
                toast.error(`${file.name}: ${result.error}`);
                continue; // skip invalid files, keep the rest
            }
            if (result.warning) toast(`${file.name}: ${result.warning}`, { icon: '⚠️', duration: 6000 });
            toAdd.push({ file, preview: URL.createObjectURL(file), url: null });
        }
        if (files.length > remaining) {
            toast.error(`Only ${remaining} more gallery image(s) allowed (max 6).`);
        }
        if (toAdd.length) setGalleryFiles(prev => [...prev, ...toAdd]);
    };

    const handleGalleryRemove = (idx) => {
        setGalleryFiles(prev => {
            const item = prev[idx];
            if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Upload primary image
            let imageUrl = editingProduct?.image_url || null;
            if (primaryFile) {
                const res = await api.post('/upload', (() => { const f = new FormData(); f.append('image', primaryFile); return f; })(), { headers: { 'Content-Type': 'multipart/form-data' } });
                imageUrl = res.data.url;
            }

            // Upload new gallery images
            const finalGallery = [];
            for (const item of galleryFiles) {
                if (item.file) {
                    const f = new FormData(); f.append('image', item.file);
                    const res = await api.post('/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } });
                    finalGallery.push(res.data.url);
                } else if (item.url) {
                    finalGallery.push(item.url);
                }
            }

            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const payload = {
                name: formData.name, slug,
                category_id: Number(formData.category_id),
                base_price: Number(formData.basePrice),
                stock: Number(formData.stock),
                rating: Number(formData.rating),
                review_count: Number(formData.reviewCount),
                description: formData.description,
                short_description: formData.short_description,
                image_url: imageUrl,
                gallery_images: finalGallery,
                is_featured: formData.isFeatured ? 1 : 0,
                is_new: formData.isNew ? 1 : 0,
                origin: formData.origin,
                shelf_life: formData.shelfLife,
                storage_instructions: formData.storageInstructions,
                weight_options: formData.weightOptions.map(o => ({
                    label: o.label,
                    price: Number(o.price),
                    originalPrice: Number(o.originalPrice) || 0
                }))
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
                toast.success('Product updated');
            } else {
                await createProduct(payload);
                toast.success('Product created');
            }
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save product');
        } finally { setIsSubmitting(false); }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteProductItem) return;
        try {
            await deleteProduct(deleteProductItem.id);
            toast.success('Product deleted');
            loadData();
        } catch { toast.error('Failed to delete product'); }
        finally { setDeleteProductItem(null); }
    };

    const fd = formData;
    const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
    const inputCls = 'w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]';

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
        ]
    }), []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#3A2E1F]">Product Management</h1>
                    <p className="text-xs text-[#3A2E1F]/70">View, add, edit, and organize catalog items and inventory</p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={loadData}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#FFFDF9] border border-[#E8DEC8] hover:bg-[#F5EFE0] text-[#3A2E1F] transition-all">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : 'text-[#D97706]'}`} />
                        <span>Refresh</span>
                    </button>
                    <button type="button" onClick={() => setIsBulkImportOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3A2E1F] hover:bg-[#D97706] text-white font-extrabold text-xs rounded-full shadow-md transition-all">
                        <FileDown className="w-4 h-4" /><span>Import CSV</span>
                    </button>
                    <button type="button" onClick={() => handleOpenForm(null)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-extrabold text-xs rounded-full shadow-md transition-all">
                        <Plus className="w-4 h-4" /><span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search products by name or category..."
                        className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                    <Search className="w-4 h-4 text-[#3A2E1F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="text-xs font-bold text-[#3A2E1F]/70 flex items-center gap-2">
                    <span>Total:</span>
                    <span className="bg-[#F5EFE0] px-2.5 py-1 rounded-full text-[#D97706]">{products.length}</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {isLoading ? <AdminSkeletonTable rows={6} /> : filteredProducts.length === 0 ? (
                    <AdminEmptyState title="No Products Match" description={`No results for "${searchTerm}".`} actionLabel="Reset" onAction={() => setSearchTerm('')} />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E8DEC8] text-[11px] font-bold uppercase tracking-wider text-[#3A2E1F]/60">
                                        <th className="py-3 px-4">Item</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Price</th>
                                        <th className="py-3 px-4">Stock</th>
                                        <th className="py-3 px-4">Badges</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8DEC8]/60 text-xs font-semibold text-[#3A2E1F]">
                                    {paginatedProducts.map(p => {
                                        const isLowStock = p.stock < 5;
                                        return (
                                            <tr key={p.id} className="hover:bg-[#F5EFE0]/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative shrink-0">
                                                            <img src={p.image_url || '/placeholder.png'} alt={p.name}
                                                                className="w-11 h-11 rounded-xl object-cover border border-[#E8DEC8] bg-[#F5EFE0]"
                                                                onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                                            {p.gallery_images?.length > 0 && (
                                                                <span className="absolute -bottom-1 -right-1 bg-[#3A2E1F] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                                                    +{p.gallery_images.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-sm text-[#3A2E1F] block line-clamp-1">{p.name}</span>
                                                            <span className="text-[10px] text-[#3A2E1F]/50 font-mono">/{p.slug}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2.5 py-1 bg-[#F5EFE0] text-[#D97706] rounded-full text-[11px] font-bold border border-[#E8DEC8]">{p.category_name}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <span className="font-extrabold text-sm text-[#3A2E1F]">{formatPrice(p.base_price)}</span>
                                                        {p.discount_percent > 0 && (
                                                            <span className="ml-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">-{p.discount_percent}%</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-extrabold border border-rose-300">
                                                            <AlertCircle className="w-3 h-3" />{p.stock} (Low)
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold text-[#3A2E1F]">{p.stock} units</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.is_featured ? <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200"><Check className="w-2.5 h-2.5" />Featured</span> : null}
                                                        {p.is_new ? <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">New</span> : null}
                                                        {!p.is_featured && !p.is_new && <span className="text-[#3A2E1F]/40 text-[11px]">Standard</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button type="button" onClick={() => handleOpenForm(p)}
                                                            className="p-2 bg-[#F5EFE0] hover:bg-[#F5A623] text-[#3A2E1F] rounded-xl transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => setDeleteProductItem(p)}
                                                            className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[#E8DEC8] gap-4 text-xs font-semibold text-[#3A2E1F]/70">
                            <span>Showing {filteredProducts.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length}</span>
                            <div className="flex items-center gap-1">
                                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="p-2 rounded-lg border border-[#E8DEC8] hover:bg-[#F5EFE0] disabled:opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button type="button" className="px-3 py-1 rounded-lg bg-[#F5A623] text-[#3A2E1F] font-bold">{currentPage}</button>
                                <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="p-2 rounded-lg border border-[#E8DEC8] hover:bg-[#F5EFE0] disabled:opacity-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ADD / EDIT SLIDE-OVER */}
            <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <form onSubmit={handleSaveProduct} className="space-y-5">

                    {/* Product Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Product Title</label>
                        <input required type="text" value={fd.name} onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Premium Organic Almonds" className={inputCls} />
                    </div>

                    {/* Short Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Tagline / Short Description</label>
                        <input type="text" value={fd.short_description} onChange={e => set('short_description', e.target.value)}
                            placeholder="e.g. High-quality organic almonds" className={inputCls} />
                    </div>

                    {/* Category + Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Category</label>
                            <select value={fd.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Stock Qty</label>
                            <input required type="number" min="0" value={fd.stock} onChange={e => set('stock', e.target.value)} placeholder="50" className={inputCls} />
                        </div>
                    </div>

                    {/* Price + Discount + Rating */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Base Price (₨)</label>
                            <input required type="number" min="0" value={fd.basePrice} onChange={e => set('basePrice', e.target.value)} placeholder="1500" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Init. Rating</label>
                            <input type="number" step="0.1" min="1" max="5" value={fd.rating} onChange={e => set('rating', e.target.value)} placeholder="4.8" className={inputCls} />
                        </div>
                    </div>

                    {/* Origin + Shelf Life + Storage */}
                    <div className="p-4 bg-[#F5EFE0]/40 rounded-2xl border border-[#E8DEC8] space-y-3">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Product Details</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#3A2E1F]/60 uppercase">Origin</label>
                                <input type="text" value={fd.origin} onChange={e => set('origin', e.target.value)}
                                    placeholder="e.g. Farm Direct" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#3A2E1F]/60 uppercase">Shelf Life</label>
                                <input type="text" value={fd.shelfLife} onChange={e => set('shelfLife', e.target.value)}
                                    placeholder="e.g. 12 months" className={inputCls} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#3A2E1F]/60 uppercase">Storage Instructions</label>
                            <input type="text" value={fd.storageInstructions} onChange={e => set('storageInstructions', e.target.value)}
                                placeholder="e.g. Store in cool, dry place away from sunlight" className={inputCls} />
                        </div>
                    </div>

                    {/* Weight Options */}
                    <div className="space-y-3 p-4 bg-[#F5EFE0]/40 rounded-2xl border border-[#E8DEC8]">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider">Weight / Pack Sizes</label>
                            <button type="button" onClick={() => set('weightOptions', [...fd.weightOptions, { label: '250g', price: '', originalPrice: '' }])}
                                className="text-[11px] font-bold text-[#D97706] hover:underline">+ Add size</button>
                        </div>
                        <div className="space-y-1 mb-2">
                            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 text-[10px] font-bold text-[#3A2E1F]/60 uppercase px-1">
                                <span>Label</span>
                                <span>Sale Price (₨)</span>
                                <span>Original Price (₨)</span>
                                <span></span>
                            </div>
                        </div>
                        {fd.weightOptions.map((opt, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] items-center gap-2">
                                <input type="text" required value={opt.label}
                                    onChange={e => { const o = [...fd.weightOptions]; o[i].label = e.target.value; set('weightOptions', o); }}
                                    placeholder="250g" className="bg-white border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs" />
                                <input type="number" required min="0" value={opt.price}
                                    onChange={e => { const o = [...fd.weightOptions]; o[i].price = e.target.value; set('weightOptions', o); }}
                                    placeholder="Sale ₨" className="bg-white border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs" />
                                <input type="number" min="0" value={opt.originalPrice || ''}
                                    onChange={e => { const o = [...fd.weightOptions]; o[i].originalPrice = e.target.value; set('weightOptions', o); }}
                                    placeholder="Original ₨ (optional)" className="bg-white border border-[#E8DEC8] rounded-xl px-3 py-2 text-xs" />
                                {fd.weightOptions.length > 1 && (
                                    <button type="button" onClick={() => set('weightOptions', fd.weightOptions.filter((_, j) => j !== i))}
                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><X className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                        <p className="text-[10px] text-[#3A2E1F]/50 italic">Set Original Price higher than Sale Price to show a discount. Leave empty for no discount on that size.</p>
                    </div>

                    {/* PRIMARY IMAGE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Primary / Cover Image</label>
                        <input type="file" accept="image/*" ref={primaryInputRef} className="hidden" onChange={handlePrimaryImageChange} />
                        <div onClick={() => primaryInputRef.current.click()}
                            className="border-2 border-dashed border-[#E8DEC8] hover:border-[#F5A623] rounded-2xl p-5 text-center bg-[#F5EFE0]/20 hover:bg-[#F5EFE0]/40 transition-colors cursor-pointer">
                            {primaryPreview ? (
                                <img src={primaryPreview} alt="Primary" className="h-36 object-contain mx-auto rounded-xl" />
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-[#D97706] mx-auto mb-1" />
                                    <p className="text-xs font-bold text-[#3A2E1F]">Click to upload cover image</p>
                                    <p className="text-[10px] text-[#3A2E1F]/60">PNG, JPG, WEBP • max 5MB • square 1:1 (1200×1200 recommended, min 800×800)</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* GALLERY IMAGES */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider flex items-center gap-1.5">
                                <Images className="w-3.5 h-3.5 text-[#D97706]" /> Gallery Images
                                <span className="text-[#3A2E1F]/40 font-normal normal-case">({galleryFiles.length}/6)</span>
                            </label>
                            {galleryFiles.length < 6 && (
                                <button type="button" onClick={() => galleryInputRef.current.click()}
                                    className="text-[11px] font-bold text-[#D97706] hover:underline">+ Add images</button>
                            )}
                        </div>
                        <input type="file" accept="image/*" multiple ref={galleryInputRef} className="hidden" onChange={handleGalleryAdd} />
                        {galleryFiles.length === 0 ? (
                            <div onClick={() => galleryInputRef.current.click()}
                                className="border-2 border-dashed border-[#E8DEC8] hover:border-[#F5A623] rounded-2xl p-4 text-center cursor-pointer hover:bg-[#F5EFE0]/30 transition-colors">
                                <Images className="w-6 h-6 text-[#D97706]/50 mx-auto mb-1" />
                                <p className="text-[11px] text-[#3A2E1F]/50">Click to add gallery photos (shown in product slider)</p>
                                <p className="text-[10px] text-[#3A2E1F]/40 mt-0.5">Square 1:1 • min 800×800px • max 5MB</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {galleryFiles.map((item, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E8DEC8] aspect-square bg-[#F5EFE0]">
                                        <img src={item.preview} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => handleGalleryRemove(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {galleryFiles.length < 6 && (
                                    <div onClick={() => galleryInputRef.current.click()}
                                        className="border-2 border-dashed border-[#E8DEC8] hover:border-[#F5A623] rounded-xl aspect-square flex items-center justify-center cursor-pointer hover:bg-[#F5EFE0]/30 transition-colors">
                                        <Plus className="w-6 h-6 text-[#D97706]/50" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">Full Description</label>
                        <div className="bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[#E8DEC8] [&_.ql-toolbar]:bg-[#F5EFE0]/60 [&_.ql-container]:border-0 [&_.ql-container]:text-xs [&_.ql-container]:text-[#3A2E1F] [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:max-h-[250px] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:px-4 [&_.ql-editor]:py-3 [&_.ql-editor.ql-blank::before]:text-[#3A2E1F]/40 [&_.ql-editor.ql-blank::before]:not-italic">
                            <RichTextEditor
                                theme="snow"
                                value={fd.description}
                                onChange={(value) => set('description', value)}
                                modules={quillModules}
                                placeholder="Enter detailed product information, benefits, nutritional content..."
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-[#F5EFE0] rounded-2xl border border-[#E8DEC8]">
                            <span className="text-xs font-bold text-[#3A2E1F] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#D97706]" /> Featured
                            </span>
                            <input type="checkbox" checked={fd.isFeatured} onChange={e => set('isFeatured', e.target.checked)}
                                className="w-4 h-4 accent-[#F5A623] cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#F5EFE0] rounded-2xl border border-[#E8DEC8]">
                            <span className="text-xs font-bold text-[#3A2E1F] flex items-center gap-1.5">
                                <Tag className="w-4 h-4 text-blue-500" /> New Arrival
                            </span>
                            <input type="checkbox" checked={fd.isNew} onChange={e => set('isNew', e.target.checked)}
                                className="w-4 h-4 accent-blue-500 cursor-pointer" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8DEC8] flex gap-3">
                        <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}
                            className="w-1/2 py-3 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting}
                            className="w-1/2 flex items-center justify-center gap-2 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-md disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {editingProduct ? 'Update Product' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </SlideOver>

            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                mode="products"
                onImport={handleBulkImport}
            />

            <ConfirmDialog isOpen={!!deleteProductItem} onClose={() => setDeleteProductItem(null)}
                onConfirm={handleDeleteConfirm} title="Delete Product"
                message={`Delete "${deleteProductItem?.name}"?`}
                warningNote="This cannot be undone." />
        </div>
    );
}
