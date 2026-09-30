const express = require('express');
const { parseJSON } = require('../helpers');
const { triggerRevalidate } = require('../services/revalidateService');

module.exports = function (pool, requireAdmin) {
    const router = express.Router();

    // Resolve a product's slug + category slug so we can revalidate the exact
    // Next pages it appears on. Best-effort: returns {} on any error.
    async function productRevalidateInfo(productId) {
        try {
            const [rows] = await pool.query(
                `SELECT p.slug, c.slug AS category_slug
                   FROM products p
                   LEFT JOIN categories c ON p.category_id = c.id
                  WHERE p.id = ?`,
                [productId]
            );
            return rows.length ? rows[0] : {};
        } catch {
            return {};
        }
    }

    // GET /api/products (public — F1: supports pagination, B7: excludes soft-deleted)
    router.get('/', async (req, res, next) => {
        try {
            const { category, search, featured, page, limit } = req.query;

            let query = `
              SELECT p.*, c.name as category_name, c.slug as category_slug 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE (p.is_deleted IS NULL OR p.is_deleted = 0)
            `;
            const params = [];

            if (category) {
                query += ' AND c.slug = ?';
                params.push(category);
            }
            if (search) {
                query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            if (featured === 'true') {
                query += ' AND p.is_featured = 1';
            }

            // F1: Count total before pagination
            const countQuery = query.replace(/SELECT p\.\*, c\.name as category_name, c\.slug as category_slug/, 'SELECT COUNT(*) as total');
            const [countRows] = await pool.query(countQuery, params);
            const total = countRows[0].total;

            query += ' ORDER BY p.id DESC';

            // F1: Apply pagination if requested
            const pageNum = Math.max(1, parseInt(page) || 1);
            const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
            if (page) {
                query += ' LIMIT ? OFFSET ?';
                params.push(pageSize, (pageNum - 1) * pageSize);
            }

            const [rows] = await pool.query(query, params);
            const products = rows.map(p => ({
                ...p,
                weight_options: parseJSON(p.weight_options),
                gallery_images: parseJSON(p.gallery_images) || []
            }));

            res.json({
                products,
                pagination: {
                    total,
                    page: pageNum,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/products/:slug (public)
    router.get('/:slug', async (req, res, next) => {
        try {
            const { slug } = req.params;
            const [rows] = await pool.query(`
              SELECT p.*, c.name as category_name, c.slug as category_slug 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE p.slug = ?
            `, [slug]);

            if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
            const product = rows[0];
            product.weight_options = parseJSON(product.weight_options);
            product.gallery_images = parseJSON(product.gallery_images) || [];
            res.json(product);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/products (admin)
    router.post('/', requireAdmin, async (req, res, next) => {
        try {
            const {
                name, slug, description, short_description, category_id, image_url, gallery_images,
                base_price, stock, weight_options, is_featured, rating, review_count,
                origin, shelf_life, storage_instructions, discount_percent, is_new
            } = req.body;

            if (!name || !slug) return res.status(400).json({ error: 'Product name and slug are required' });
            if (base_price === undefined || base_price === null || Number(base_price) < 0) {
                return res.status(400).json({ error: 'A valid base price is required' });
            }

            const [result] = await pool.query(`
              INSERT INTO products (
                name, slug, description, short_description, category_id, image_url, gallery_images,
                base_price, stock, weight_options, is_featured, rating, review_count,
                origin, shelf_life, storage_instructions, discount_percent, is_new
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, slug, description || null, short_description || null,
                category_id || null, image_url || null,
                Array.isArray(gallery_images) ? JSON.stringify(gallery_images) : (gallery_images || null),
                Number(base_price), stock || 0,
                typeof weight_options === 'string' ? weight_options : JSON.stringify(weight_options || []),
                is_featured ? 1 : 0,
                rating ? Number(rating) : 4.8,
                review_count ? Number(review_count) : 0,
                origin || null, shelf_life || null, storage_instructions || null,
                discount_percent ? Number(discount_percent) : 0,
                is_new ? 1 : 0
            ]);

            res.status(201).json({ id: result.insertId, message: 'Product created successfully' });

            // Regenerate the affected Next pages (fire-and-forget).
            const info = await productRevalidateInfo(result.insertId);
            triggerRevalidate({ type: 'product', slug: info.slug || slug, categorySlug: info.category_slug });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'A product with this slug already exists. Please use a different name.' });
            }
            next(error);
        }
    });

    // PUT /api/products/:id (admin)
    router.put('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const {
                name, slug, description, short_description, category_id, image_url, gallery_images,
                base_price, stock, weight_options, is_featured, rating, review_count,
                origin, shelf_life, storage_instructions, discount_percent, is_new
            } = req.body;

            const [result] = await pool.query(`
              UPDATE products SET
                name = ?, slug = ?, description = ?, short_description = ?,
                category_id = ?, image_url = ?, gallery_images = ?,
                base_price = ?, stock = ?, weight_options = ?, is_featured = ?,
                rating = ?, review_count = ?,
                origin = ?, shelf_life = ?, storage_instructions = ?,
                discount_percent = ?, is_new = ?
              WHERE id = ?
            `, [
                name, slug, description || null, short_description || null,
                category_id || null, image_url || null,
                Array.isArray(gallery_images) ? JSON.stringify(gallery_images) : (gallery_images || null),
                Number(base_price), Number(stock) || 0,
                typeof weight_options === 'string' ? weight_options : JSON.stringify(weight_options || []),
                is_featured ? 1 : 0,
                rating !== undefined ? Number(rating) : 4.8,
                review_count !== undefined ? Number(review_count) : 0,
                origin || null, shelf_life || null, storage_instructions || null,
                discount_percent ? Number(discount_percent) : 0,
                is_new ? 1 : 0,
                id
            ]);

            if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
            res.json({ message: 'Product updated successfully' });

            // Regenerate the affected Next pages (fire-and-forget).
            const info = await productRevalidateInfo(id);
            triggerRevalidate({ type: 'product', slug: info.slug || slug, categorySlug: info.category_slug });
        } catch (error) {
            next(error);
        }
    });

    // DELETE /api/products/:id (admin — B7: soft-delete)
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            // Capture slug/category before archiving so we can revalidate the
            // now-removed product page (it should 404 / drop from listings).
            const info = await productRevalidateInfo(id);
            const [result] = await pool.query('UPDATE products SET is_deleted = 1 WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
            res.json({ message: 'Product archived successfully' });

            // Regenerate the affected Next pages (fire-and-forget).
            triggerRevalidate({ type: 'product', slug: info.slug, categorySlug: info.category_slug });
        } catch (error) {
            next(error);
        }
    });

    // B6: GET /api/products/:id/stock (public — cart stock validation)
    router.get('/:id/stock', async (req, res, next) => {
        try {
            const [rows] = await pool.query('SELECT id, name, stock FROM products WHERE id = ?', [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
            const product = rows[0];
            res.json({ id: product.id, name: product.name, stock: product.stock });
        } catch (error) {
            next(error);
        }
    });

    // POST /api/products/bulk-import (admin)
    router.post('/bulk-import', requireAdmin, async (req, res, next) => {
        try {
            const { products } = req.body;
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ error: 'products array is required' });
            }

            const results = { imported: 0, skipped: 0, errors: [] };

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                for (let i = 0; i < products.length; i++) {
                    const p = products[i];
                    const name = (p.name || '').trim();
                    if (!name || p.base_price === undefined || p.base_price === '') {
                        results.errors.push(`Row ${i + 1}: name and base_price are required`);
                        continue;
                    }
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

                    // Resolve category by name (MySQL is case-insensitive by default)
                    let category_id = null;
                    if (p.category_name) {
                        const [catRows] = await conn.query('SELECT id FROM categories WHERE name = ?', [p.category_name.trim()]);
                        if (catRows.length > 0) category_id = catRows[0].id;
                    } else if (p.category_id) {
                        category_id = Number(p.category_id);
                    }

                    // Parse weight_options: "500g:800,1kg:1500" or JSON string
                    let weightOptions = '[]';
                    if (p.weight_options) {
                        if (typeof p.weight_options === 'string' && !p.weight_options.startsWith('[')) {
                            try {
                                weightOptions = JSON.stringify(
                                    p.weight_options.split(',').map(part => {
                                        const [label, price] = part.trim().split(':');
                                        return { label: label.trim(), price: Number(price) || 0 };
                                    })
                                );
                            } catch { weightOptions = '[]'; }
                        } else {
                            weightOptions = typeof p.weight_options === 'string' ? p.weight_options : JSON.stringify(p.weight_options);
                        }
                    }

                    // Parse gallery_images: pipe-separated URLs → JSON array
                    let galleryImages = null;
                    if (p.gallery_images && p.gallery_images.trim()) {
                        const urls = p.gallery_images.split('|').map(u => u.trim()).filter(Boolean);
                        if (urls.length > 0) galleryImages = JSON.stringify(urls);
                    }

                    try {
                        const [info] = await conn.query(`
                            INSERT IGNORE INTO products
                              (name, slug, description, short_description, category_id,
                               image_url, gallery_images,
                               base_price, stock, weight_options, is_featured, is_new, discount_percent,
                               origin, shelf_life, storage_instructions, rating, review_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            name, slug,
                            p.description || null,
                            p.short_description || null,
                            category_id,
                            p.image_url || null,
                            galleryImages,
                            Number(p.base_price) || 0,
                            Number(p.stock) || 0,
                            weightOptions,
                            p.is_featured ? 1 : 0,
                            p.is_new ? 1 : 0,
                            Number(p.discount_percent) || 0,
                            p.origin || null,
                            p.shelf_life || null,
                            p.storage_instructions || null,
                            Number(p.rating) || 4.8,
                            Number(p.review_count) || 0
                        ]);
                        if (info.affectedRows > 0) results.imported++;
                        else results.skipped++;
                    } catch (e) {
                        results.errors.push(`Row ${i + 1} "${name}": ${e.message}`);
                    }
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            res.json({ message: 'Import complete', ...results });
        } catch (error) { next(error); }
    });

    return router;
};
