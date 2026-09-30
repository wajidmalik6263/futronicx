const express = require('express');
const { triggerRevalidate } = require('../services/revalidateService');

// Helper to transform a blog row from DB format to client-expected format
function transformBlog(row) {
    if (!row) return null;
    const tags = row.tags ? (() => { try { return JSON.parse(row.tags); } catch { return row.tags.split(',').map(t => t.trim()).filter(Boolean); } })() : [];
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        content: row.content || '',
        image: row.image_url || '',
        thumbnail: row.image_url || '',
        category: row.category_name || '',
        categorySlug: row.category_slug || '',
        category_id: row.category_id,
        author: row.author || 'Admin',
        tags,
        views: row.views || 0,
        readTime: row.read_time || null,
        metaTitle: row.meta_title || '',
        metaDescription: row.meta_description || '',
        status: row.is_published ? 'published' : 'draft',
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        publishedAt: row.is_published ? (row.updated_at || row.created_at) : null
    };
}

module.exports = function (pool, requireAdmin, upload) {
    const router = express.Router();

    // All routes in this file require admin authentication
    router.use(requireAdmin);

    // GET /api/admin/blogs — list all blogs (published + drafts) with pagination
    router.get('/', async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 50));
            const offset = (page - 1) * limit;
            const { search, category, status } = req.query;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (search) {
                whereClause += ' AND (b.title LIKE ? OR b.excerpt LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (category) {
                whereClause += ' AND b.category_id = ?';
                params.push(category);
            }

            if (status === 'published') {
                whereClause += ' AND b.is_published = 1';
            } else if (status === 'draft') {
                whereClause += ' AND b.is_published = 0';
            }

            // Get total count
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM blogs b ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // Get paginated blogs
            const [blogs] = await pool.query(
                `SELECT b.*, bc.name as category_name, bc.slug as category_slug
                 FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 ${whereClause}
                 ORDER BY b.created_at DESC
                 LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            res.json({
                blogs: blogs.map(transformBlog),
                totalPages: Math.ceil(total / limit),
                page,
                limit,
                total
            });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/admin/blogs/categories — list all blog categories (admin)
    router.get('/categories', async (req, res, next) => {
        try {
            const [categories] = await pool.query(`
                SELECT bc.*, COUNT(b.id) as blogCount
                FROM blog_categories bc
                LEFT JOIN blogs b ON b.category_id = bc.id
                GROUP BY bc.id
                ORDER BY bc.name ASC
            `);
            res.json(categories);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/admin/blogs/categories — create a blog category
    router.post('/categories', async (req, res, next) => {
        try {
            const { name, slug } = req.body;
            if (!name || !slug) {
                return res.status(400).json({ error: 'Name and slug are required' });
            }
            const [result] = await pool.query(
                'INSERT INTO blog_categories (name, slug) VALUES (?, ?)',
                [name, slug]
            );
            res.status(201).json({ id: result.insertId, name, slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A blog category with this slug already exists' });
            }
            next(error);
        }
    });

    // PUT /api/admin/blogs/categories/:id — update a blog category
    router.put('/categories/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, slug } = req.body;
            if (!name || !slug) {
                return res.status(400).json({ error: 'Name and slug are required' });
            }
            const [result] = await pool.query(
                'UPDATE blog_categories SET name = ?, slug = ? WHERE id = ?',
                [name, slug, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Blog category not found' });
            }
            res.json({ id: Number(id), name, slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A blog category with this slug already exists' });
            }
            next(error);
        }
    });

    // DELETE /api/admin/blogs/categories/:id — delete a blog category
    router.delete('/categories/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM blog_categories WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Blog category not found' });
            }
            res.json({ message: 'Blog category deleted successfully' });
        } catch (error) {
            next(error);
        }
    });

    // POST /api/admin/blogs/upload — upload blog image (must be before /:id route)
    router.post('/upload', upload.single('image'), (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided' });
            }

            // Cloudinary returns the URL in req.file.path; local storage uses constructed URL
            const imageUrl = req.file.path || `/uploads/${req.file.filename}`;
            res.json({ url: imageUrl });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/admin/blogs/:id — get single blog by id (admin view, includes drafts)
    router.get('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const [blogs] = await pool.query(
                `SELECT b.*, bc.name as category_name, bc.slug as category_slug
                 FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 WHERE b.id = ?`,
                [id]
            );

            if (blogs.length === 0) {
                return res.status(404).json({ error: 'Blog post not found' });
            }

            res.json(transformBlog(blogs[0]));
        } catch (error) {
            next(error);
        }
    });

    // POST /api/admin/blogs — create a new blog post
    router.post('/', async (req, res, next) => {
        try {
            const { title, slug, excerpt, content, thumbnail, image, image_url, category, category_id, author, tags, status, is_published, metaTitle, metaDescription, readTime } = req.body;

            if (!title || !slug) {
                return res.status(400).json({ error: 'Title and slug are required' });
            }

            // Resolve image URL from various possible field names the client might send
            const resolvedImageUrl = thumbnail || image || image_url || null;

            // Resolve category_id: client sends category as string name, need to look it up or use category_id directly
            let resolvedCategoryId = category_id || null;
            if (!resolvedCategoryId && category) {
                const [cats] = await pool.query('SELECT id FROM blog_categories WHERE name = ? OR slug = ?', [category, category]);
                if (cats.length > 0) {
                    resolvedCategoryId = cats[0].id;
                } else {
                    // Auto-create the category
                    const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    const [result] = await pool.query('INSERT INTO blog_categories (name, slug) VALUES (?, ?)', [category, catSlug]);
                    resolvedCategoryId = result.insertId;
                }
            }

            // Resolve published status
            const published = status === 'published' ? 1 : (is_published ? 1 : 0);

            // Tags: accept array or comma-separated string
            let tagsJson = null;
            if (tags) {
                const tagsArr = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
                tagsJson = JSON.stringify(tagsArr);
            }

            const [result] = await pool.query(
                `INSERT INTO blogs (title, slug, excerpt, content, image_url, category_id, author, tags, is_published, meta_title, meta_description, read_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title,
                    slug,
                    excerpt || null,
                    content || null,
                    resolvedImageUrl,
                    resolvedCategoryId,
                    author || 'Admin',
                    tagsJson,
                    published,
                    metaTitle || null,
                    metaDescription || null,
                    readTime ? parseInt(readTime, 10) : null
                ]
            );

            // Fetch and return the created blog
            const [newBlog] = await pool.query(
                `SELECT b.*, bc.name as category_name, bc.slug as category_slug
                 FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 WHERE b.id = ?`,
                [result.insertId]
            );
            res.status(201).json(transformBlog(newBlog[0]));

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'blog', slug: newBlog[0]?.slug || slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A blog post with this slug already exists' });
            }
            next(error);
        }
    });

    // PUT /api/admin/blogs/:id — update a blog post
    router.put('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            const { title, slug, excerpt, content, thumbnail, image, image_url, category, category_id, author, tags, status, is_published, metaTitle, metaDescription, readTime } = req.body;

            if (!title || !slug) {
                return res.status(400).json({ error: 'Title and slug are required' });
            }

            // Resolve image URL
            const resolvedImageUrl = thumbnail || image || image_url || null;

            // Resolve category_id
            let resolvedCategoryId = category_id || null;
            if (!resolvedCategoryId && category) {
                const [cats] = await pool.query('SELECT id FROM blog_categories WHERE name = ? OR slug = ?', [category, category]);
                if (cats.length > 0) {
                    resolvedCategoryId = cats[0].id;
                } else {
                    // Auto-create the category
                    const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    const [result] = await pool.query('INSERT INTO blog_categories (name, slug) VALUES (?, ?)', [category, catSlug]);
                    resolvedCategoryId = result.insertId;
                }
            }

            // Resolve published status
            const published = status === 'published' ? 1 : (is_published ? 1 : 0);

            // Tags
            let tagsJson = null;
            if (tags) {
                const tagsArr = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
                tagsJson = JSON.stringify(tagsArr);
            }

            const [result] = await pool.query(
                `UPDATE blogs SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?,
                 category_id = ?, author = ?, tags = ?, is_published = ?, meta_title = ?, meta_description = ?, read_time = ?
                 WHERE id = ?`,
                [
                    title,
                    slug,
                    excerpt || null,
                    content || null,
                    resolvedImageUrl,
                    resolvedCategoryId,
                    author || 'Admin',
                    tagsJson,
                    published,
                    metaTitle || null,
                    metaDescription || null,
                    readTime ? parseInt(readTime, 10) : null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Blog post not found' });
            }

            const [updatedBlog] = await pool.query(
                `SELECT b.*, bc.name as category_name, bc.slug as category_slug
                 FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 WHERE b.id = ?`,
                [id]
            );
            res.json(transformBlog(updatedBlog[0]));

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'blog', slug: updatedBlog[0]?.slug || slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A blog post with this slug already exists' });
            }
            next(error);
        }
    });

    // DELETE /api/admin/blogs/:id — delete a blog post
    router.delete('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            // Capture the slug before deletion so we can revalidate the now-gone
            // blog page (it should 404 / drop from the listing).
            const [existing] = await pool.query('SELECT slug FROM blogs WHERE id = ?', [id]);
            const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Blog post not found' });
            }
            res.json({ message: 'Blog post deleted successfully' });

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'blog', slug: existing[0]?.slug });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
