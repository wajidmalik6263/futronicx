import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, Edit, Trash2, Eye, EyeOff,
    RefreshCw, ChevronLeft, ChevronRight, Loader2,
    UploadCloud, Calendar, Tag, FileText
} from 'lucide-react';
import RichTextEditor from '../../components/admin/RichTextEditor';
import {
    SlideOver, ConfirmDialog, AdminEmptyState, AdminSkeletonTable
} from '../../components/admin/AdminComponents';
import { getAdminBlogs, createBlog, updateBlog, deleteBlog, uploadBlogImage } from '../../api/blogs';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    author: '',
    readTime: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: ''
};

export default function AdminBlogs() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [blogs, setBlogs] = useState([]);

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteBlogItem, setDeleteBlogItem] = useState(null);

    useEffect(() => { loadBlogs(); }, []);

    const loadBlogs = async () => {
        setIsLoading(true);
        try {
            const { data } = await getAdminBlogs();
            setBlogs(data.blogs || []);
        } catch {
            toast.error('Failed to load blogs');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBlogs = blogs.filter(b =>
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + itemsPerPage);

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleOpenForm = (blog = null) => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title || '',
                slug: blog.slug || '',
                excerpt: blog.excerpt || blog.summary || '',
                content: blog.content || blog.body || '',
                category: blog.category || '',
                tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
                author: blog.author || '',
                readTime: blog.readTime || '',
                status: blog.status || 'draft',
                metaTitle: blog.metaTitle || '',
                metaDescription: blog.metaDescription || ''
            });
            setThumbnailPreview(blog.thumbnail || blog.image || null);
        } else {
            setEditingBlog(null);
            setFormData(EMPTY_FORM);
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingBlog(null);
        setFormData(EMPTY_FORM);
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        setIsSubmitting(true);
        try {
            let thumbnailUrl = editingBlog?.thumbnail || editingBlog?.image || '';

            // Upload thumbnail if new file selected
            if (thumbnailFile) {
                const fd = new FormData();
                fd.append('image', thumbnailFile);
                const { data: uploadData } = await uploadBlogImage(fd);
                thumbnailUrl = uploadData.url || uploadData.imageUrl || uploadData.path || '';
            }

            const payload = {
                title: formData.title.trim(),
                slug: formData.slug.trim() || generateSlug(formData.title),
                excerpt: formData.excerpt.trim(),
                content: formData.content,
                category: formData.category.trim(),
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                author: formData.author.trim(),
                readTime: formData.readTime ? parseInt(formData.readTime, 10) : undefined,
                status: formData.status,
                thumbnail: thumbnailUrl,
                metaTitle: formData.metaTitle.trim(),
                metaDescription: formData.metaDescription.trim()
            };

            if (editingBlog) {
                await updateBlog(editingBlog._id || editingBlog.id, payload);
                toast.success('Blog updated successfully');
            } else {
                await createBlog(payload);
                toast.success('Blog created successfully');
            }

            handleCloseForm();
            loadBlogs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save blog');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteBlogItem) return;
        try {
            await deleteBlog(deleteBlogItem._id || deleteBlogItem.id);
            toast.success('Blog deleted');
            loadBlogs();
        } catch {
            toast.error('Failed to delete blog');
        }
        setDeleteBlogItem(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link', 'image'],
            ['clean']
        ]
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-[#3A2E1F]">Blog Posts</h1>
                    <p className="text-xs text-[#3A2E1F]/60 mt-1">
                        {blogs.length} total post{blogs.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadBlogs}
                        className="p-2.5 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] rounded-xl transition-colors cursor-pointer"
                        aria-label="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleOpenForm()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        New Post
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A2E1F]/40" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFDF9] border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] placeholder-[#3A2E1F]/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <AdminSkeletonTable rows={5} />
            ) : filteredBlogs.length === 0 ? (
                <AdminEmptyState
                    title="No Blog Posts"
                    description={searchTerm ? `No results for "${searchTerm}"` : "You haven't created any blog posts yet."}
                    actionLabel="Create First Post"
                    onAction={() => handleOpenForm()}
                />
            ) : (
                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#E8DEC8] bg-[#F5EFE0]/50">
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider">Post</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider hidden md:table-cell">Category</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider hidden lg:table-cell">Author</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider hidden lg:table-cell">Date</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-[#3A2E1F]/60 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8DEC8]">
                                {paginatedBlogs.map((blog) => (
                                    <tr key={blog._id || blog.id} className="hover:bg-[#F5EFE0]/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5EFE0] border border-[#E8DEC8] shrink-0">
                                                    <img
                                                        src={blog.thumbnail || blog.image || '/placeholder.png'}
                                                        alt={blog.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#3A2E1F] truncate max-w-[200px]">{blog.title}</p>
                                                    <p className="text-[11px] text-[#3A2E1F]/50 truncate max-w-[200px]">{blog.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            {blog.category ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5A623]/10 text-[#D97706] rounded-full text-[11px] font-semibold">
                                                    <Tag className="w-3 h-3" />
                                                    {blog.category}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[#3A2E1F]/40">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#3A2E1F]/70 hidden lg:table-cell">
                                            {blog.author || '-'}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                blog.status === 'published'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                            }`}>
                                                {blog.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {blog.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#3A2E1F]/60 hidden lg:table-cell">
                                            {formatDate(blog.createdAt || blog.publishedAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenForm(blog)}
                                                    className="p-2 text-[#3A2E1F]/60 hover:text-[#D97706] hover:bg-[#F5EFE0] rounded-lg transition-colors cursor-pointer"
                                                    aria-label="Edit blog"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteBlogItem(blog)}
                                                    className="p-2 text-[#3A2E1F]/60 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    aria-label="Delete blog"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8DEC8]">
                            <p className="text-[11px] text-[#3A2E1F]/60">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBlogs.length)} of {filteredBlogs.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg hover:bg-[#F5EFE0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-[#3A2E1F] px-2">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg hover:bg-[#F5EFE0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SlideOver Form */}
            <SlideOver isOpen={isFormOpen} onClose={handleCloseForm} title={editingBlog ? 'Edit Blog Post' : 'New Blog Post'}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => {
                                const title = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    title,
                                    slug: prev.slug || generateSlug(title)
                                }));
                            }}
                            placeholder="Enter blog title"
                            className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            required
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder="auto-generated-from-title"
                            className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                        />
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Thumbnail Image</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-[#E8DEC8] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#F5A623] hover:bg-[#F5A623]/5 transition-colors overflow-hidden"
                        >
                            {thumbnailPreview ? (
                                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-[#D97706]" />
                                    <span className="text-xs text-[#3A2E1F]/60">Click to upload thumbnail</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="hidden"
                        />
                    </div>

                    {/* Category & Author row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                placeholder="e.g. Health Tips"
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Author</label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                placeholder="Author name"
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            />
                        </div>
                    </div>

                    {/* Tags & Read Time row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                placeholder="health, nuts, recipe"
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Read Time (min)</label>
                            <input
                                type="number"
                                value={formData.readTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                                placeholder="5"
                                min="1"
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Excerpt</label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                            placeholder="Brief summary of the article..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] resize-none"
                        />
                    </div>

                    {/* Content (Rich Text) */}
                    <div>
                        <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Content</label>
                        <div className="border border-[#E8DEC8] rounded-xl overflow-hidden bg-white">
                            <RichTextEditor
                                theme="snow"
                                value={formData.content}
                                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                                modules={quillModules}
                                placeholder="Write your blog content here..."
                                className="[&_.ql-container]:min-h-[200px] [&_.ql-container]:max-h-[400px] [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[200px]"
                            />
                        </div>
                    </div>

                    {/* SEO Section */}
                    <div className="border-t border-[#E8DEC8] pt-5 space-y-4">
                        <h4 className="text-xs font-bold text-[#3A2E1F]/60 uppercase tracking-wider">SEO Settings</h4>
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Meta Title</label>
                            <input
                                type="text"
                                value={formData.metaTitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                                placeholder="Custom SEO title (defaults to blog title)"
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3A2E1F] mb-1.5">Meta Description</label>
                            <textarea
                                value={formData.metaDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                                placeholder="Custom SEO description (defaults to excerpt)"
                                rows={2}
                                className="w-full px-4 py-2.5 border border-[#E8DEC8] rounded-xl text-sm text-[#3A2E1F] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-[#E8DEC8]">
                        <button
                            type="button"
                            onClick={handleCloseForm}
                            className="flex-1 px-5 py-2.5 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-xs rounded-full shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingBlog ? 'Update Post' : 'Create Post'}
                        </button>
                    </div>
                </form>
            </SlideOver>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteBlogItem}
                onClose={() => setDeleteBlogItem(null)}
                onConfirm={handleDelete}
                title="Delete Blog Post"
                message={`Are you sure you want to delete "${deleteBlogItem?.title}"?`}
                warningNote="This action cannot be undone. The blog post will be permanently removed."
                confirmText="Delete Post"
            />
        </div>
    );
}
