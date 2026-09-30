const express = require('express');

module.exports = function (pool, requireAdmin) {
    const router = express.Router();

    // GET /api/reviews?product_id=X  (public — approved only)
    router.get('/', async (req, res, next) => {
        try {
            const { product_id } = req.query;
            if (!product_id) return res.status(400).json({ error: 'product_id is required' });
            const [reviews] = await pool.query(`
                SELECT id, customer_name, rating, title, comment, created_at
                FROM product_reviews
                WHERE product_id = ? AND is_approved = 1
                ORDER BY created_at DESC
            `, [product_id]);
            res.json(reviews);
        } catch (error) { next(error); }
    });

    // GET /api/reviews/admin  (admin — all reviews for moderation)
    router.get('/admin', requireAdmin, async (req, res, next) => {
        try {
            const [reviews] = await pool.query(`
                SELECT r.*, p.name as product_name, p.slug as product_slug
                FROM product_reviews r
                LEFT JOIN products p ON r.product_id = p.id
                ORDER BY r.created_at DESC
            `);
            res.json(reviews);
        } catch (error) { next(error); }
    });

    // POST /api/reviews  (public — customer submits review)
    router.post('/', async (req, res, next) => {
        try {
            const { product_id, customer_name, customer_email, rating, title, comment } = req.body;
            if (!product_id || !customer_name || !rating) {
                return res.status(400).json({ error: 'product_id, customer_name, and rating are required' });
            }
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }
            const [productRows] = await pool.query('SELECT id FROM products WHERE id = ? AND (is_deleted IS NULL OR is_deleted = 0)', [product_id]);
            if (productRows.length === 0) return res.status(404).json({ error: 'Product not found' });

            const [result] = await pool.query(`
                INSERT INTO product_reviews (product_id, customer_name, customer_email, rating, title, comment, is_approved)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `, [product_id, customer_name.trim(), customer_email || null, Number(rating), title?.trim() || null, comment?.trim() || null]);

            res.status(201).json({ id: result.insertId, message: 'Review submitted and pending approval' });
        } catch (error) { next(error); }
    });

    // PATCH /api/reviews/:id  (admin — approve or reject)
    router.patch('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { is_approved } = req.body;
            const [result] = await pool.query('UPDATE product_reviews SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found' });

            // Recalculate product rating from approved reviews
            const [reviewRows] = await pool.query('SELECT product_id FROM product_reviews WHERE id = ?', [id]);
            if (reviewRows.length > 0) {
                const [stats] = await pool.query(`
                    SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
                    FROM product_reviews WHERE product_id = ? AND is_approved = 1
                `, [reviewRows[0].product_id]);
                await pool.query('UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
                    [stats[0].avg_rating ? Number(stats[0].avg_rating).toFixed(1) : 0, stats[0].review_count || 0, reviewRows[0].product_id]);
            }

            res.json({ message: is_approved ? 'Review approved' : 'Review rejected' });
        } catch (error) { next(error); }
    });

    // DELETE /api/reviews/:id  (admin)
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            // Recalculate rating after delete
            const [reviewRows] = await pool.query('SELECT product_id FROM product_reviews WHERE id = ?', [id]);
            const [result] = await pool.query('DELETE FROM product_reviews WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Review not found' });

            if (reviewRows.length > 0) {
                const [stats] = await pool.query(`
                    SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
                    FROM product_reviews WHERE product_id = ? AND is_approved = 1
                `, [reviewRows[0].product_id]);
                await pool.query('UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
                    [stats[0].avg_rating ? Number(stats[0].avg_rating).toFixed(1) : 0, stats[0].review_count || 0, reviewRows[0].product_id]);
            }
            res.json({ message: 'Review deleted' });
        } catch (error) { next(error); }
    });

    return router;
};
