const express = require('express');
const { triggerRevalidate } = require('../services/revalidateService');

module.exports = function (pool, requireAdmin) {
    const router = express.Router();

    // GET /api/categories (public, with product count)
    router.get('/', async (req, res, next) => {
        try {
            const [categories] = await pool.query(`
                SELECT c.*, COUNT(p.id) as productCount
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.id
                GROUP BY c.id
                ORDER BY c.name ASC
            `);
            res.json(categories);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/categories (admin)
    router.post('/', requireAdmin, async (req, res, next) => {
        try {
            const { name, slug, image_url } = req.body;
            if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
            const [result] = await pool.query('INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)', [name, slug, image_url || null]);
            res.status(201).json({ id: result.insertId, name, slug, image_url: image_url || null });

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'category', slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A category with this slug already exists' });
            }
            next(error);
        }
    });

    // POST /api/categories/bulk-import (admin)
    router.post('/bulk-import', requireAdmin, async (req, res, next) => {
        try {
            const { categories } = req.body;
            if (!Array.isArray(categories) || categories.length === 0) {
                return res.status(400).json({ error: 'categories array is required' });
            }

            const results = { imported: 0, skipped: 0, errors: [] };

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                for (const cat of categories) {
                    const name = (cat.name || '').trim();
                    if (!name) { results.errors.push(`Row skipped: name is required`); continue; }
                    const slug = (cat.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();
                    try {
                        const [info] = await conn.query('INSERT IGNORE INTO categories (name, slug, image_url) VALUES (?, ?, ?)', [name, slug, cat.image_url || null]);
                        if (info.affectedRows > 0) results.imported++;
                        else results.skipped++;
                    } catch (e) {
                        results.errors.push(`"${name}": ${e.message}`);
                    }
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            res.json({ message: `Import complete`, ...results });
        } catch (error) { next(error); }
    });

    // PUT /api/categories/:id (admin)
    router.put('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, slug, image_url } = req.body;
            if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
            const [result] = await pool.query('UPDATE categories SET name = ?, slug = ?, image_url = ? WHERE id = ?', [name, slug, image_url || null, id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
            res.json({ id: Number(id), name, slug, image_url: image_url || null });

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'category', slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A category with this slug already exists' });
            }
            next(error);
        }
    });

    // DELETE /api/categories/:id (admin)
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            // Capture the slug before deletion so we can revalidate the now-gone
            // category page (it should 404 / drop from the listing).
            const [existing] = await pool.query('SELECT slug FROM categories WHERE id = ?', [id]);
            const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
            res.json({ message: 'Category deleted successfully' });

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'category', slug: existing[0]?.slug });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
