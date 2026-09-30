const express = require('express');

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

module.exports = function (pool) {
    const router = express.Router();

    // GET /api/blogs/categories — list all blog categories (returns array of category name strings + objects)
    router.get('/categories', async (req, res, next) => {
        try {
            const [categories] = await pool.query(`
                SELECT bc.*, COUNT(b.id) as blogCount
                FROM blog_categories bc
                LEFT JOIN blogs b ON b.category_id = bc.id AND b.is_published = 1
                GROUP BY bc.id
                ORDER BY bc.name ASC
            `);
            // Return both the full objects and a simple names array for flexibility
            res.json({
                categories: categories.map(c => c.name),
                data: categories
            });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/blogs — list published blogs (with pagination, search, category filter)
    router.get('/', async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
            const offset = (page - 1) * limit;
            const { search, category, tag, q } = req.query;
            const searchTerm = search || q || '';

            let whereClause = 'WHERE b.is_published = 1';
            const params = [];

            if (searchTerm) {
                whereClause += ' AND (b.title LIKE ? OR b.excerpt LIKE ? OR b.tags LIKE ?)';
                params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
            }

            if (category) {
                whereClause += ' AND (bc.slug = ? OR bc.name = ?)';
                params.push(category, category);
            }

            if (tag) {
                whereClause += ' AND b.tags LIKE ?';
                params.push(`%${tag}%`);
            }

            // Get total count
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 ${whereClause}`,
                params
            );
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

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
                totalPages,
                page,
                limit,
                total
            });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/blogs/:slug — get single published blog by slug
    router.get('/:slug', async (req, res, next) => {
        try {
            const { slug } = req.params;

            const [blogs] = await pool.query(
                `SELECT b.*, bc.name as category_name, bc.slug as category_slug
                 FROM blogs b
                 LEFT JOIN blog_categories bc ON b.category_id = bc.id
                 WHERE b.slug = ? AND b.is_published = 1`,
                [slug]
            );

            if (blogs.length === 0) {
                return res.status(404).json({ error: 'Blog post not found' });
            }

            // Increment view count
            await pool.query('UPDATE blogs SET views = views + 1 WHERE id = ?', [blogs[0].id]);

            res.json(transformBlog(blogs[0]));
        } catch (error) {
            next(error);
        }
    });

    return router;
};
