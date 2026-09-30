import api from './api';

// Public endpoints
export const getBlogs = (params = {}) => api.get('/blogs', { params });
export const getBlogBySlug = (slug) => api.get(`/blogs/${slug}`);
export const getBlogCategories = () => api.get('/blogs/categories');

// Admin endpoints
export const getAdminBlogs = (params = {}) => api.get('/admin/blogs', { params });
export const getAdminBlogById = (id) => api.get(`/admin/blogs/${id}`);
export const createBlog = (data) => api.post('/admin/blogs', data);
export const updateBlog = (id, data) => api.put(`/admin/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/admin/blogs/${id}`);
export const uploadBlogImage = (formData) => api.post('/admin/blogs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
