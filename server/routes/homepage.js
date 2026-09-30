const express = require('express');

module.exports = function (pool, requireAdmin) {
    const router = express.Router();

    // GET /api/homepage (public) — visible sections ordered by sort_order
    router.get('/', async (req, res, next) => {
        try {
            const [sections] = await pool.query(
                'SELECT * FROM homepage_sections WHERE is_visible = 1 ORDER BY sort_order ASC'
            );
            const parsed = sections.map(s => ({
                ...s,
                config: JSON.parse(s.config || '{}')
            }));
            res.json(parsed);
        } catch (error) {
            next(error);
        }
    });

    // GET /api/homepage/admin (admin) — ALL sections including hidden
    router.get('/admin', requireAdmin, async (req, res, next) => {
        try {
            const [sections] = await pool.query(
                'SELECT * FROM homepage_sections ORDER BY sort_order ASC'
            );
            const parsed = sections.map(s => ({
                ...s,
                config: JSON.parse(s.config || '{}')
            }));
            res.json(parsed);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/homepage (admin) — create a new section
    router.post('/', requireAdmin, async (req, res, next) => {
        try {
            const { section_type, title, config } = req.body;
            if (!section_type) {
                return res.status(400).json({ error: 'section_type is required' });
            }

            const validTypes = ['hero_banner', 'product_carousel', 'product_grid', 'category_showcase', 'banner_image', 'promo_cards', 'reviews'];
            if (!validTypes.includes(section_type)) {
                return res.status(400).json({ error: `Invalid section_type. Must be one of: ${validTypes.join(', ')}` });
            }

            // Get the max sort_order to append at the end
            const [maxRows] = await pool.query('SELECT MAX(sort_order) as maxOrder FROM homepage_sections');
            const nextOrder = (maxRows[0].maxOrder ?? -1) + 1;

            const configStr = typeof config === 'string' ? config : JSON.stringify(config || {});

            const [result] = await pool.query(
                'INSERT INTO homepage_sections (section_type, title, config, sort_order) VALUES (?, ?, ?, ?)',
                [section_type, title || '', configStr, nextOrder]
            );

            const [newRows] = await pool.query('SELECT * FROM homepage_sections WHERE id = ?', [result.insertId]);
            const newSection = newRows[0];
            res.status(201).json({
                ...newSection,
                config: JSON.parse(newSection.config || '{}')
            });
        } catch (error) {
            next(error);
        }
    });

    // PUT /api/homepage/reorder (admin) — bulk update sort_order
    // Body: { order: [id1, id2, id3, ...] }
    router.put('/reorder', requireAdmin, async (req, res, next) => {
        try {
            const { order } = req.body;
            if (!Array.isArray(order)) {
                return res.status(400).json({ error: 'order must be an array of section IDs' });
            }

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                for (let i = 0; i < order.length; i++) {
                    await conn.query('UPDATE homepage_sections SET sort_order = ? WHERE id = ?', [i, order[i]]);
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            const [sections] = await pool.query('SELECT * FROM homepage_sections ORDER BY sort_order ASC');
            const parsed = sections.map(s => ({
                ...s,
                config: JSON.parse(s.config || '{}')
            }));
            res.json(parsed);
        } catch (error) {
            next(error);
        }
    });

    // PUT /api/homepage/:id (admin) — update a section
    router.put('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const [existingRows] = await pool.query('SELECT * FROM homepage_sections WHERE id = ?', [id]);
            if (existingRows.length === 0) {
                return res.status(404).json({ error: 'Section not found' });
            }

            const { title, config, is_visible } = req.body;

            const updates = [];
            const values = [];

            if (title !== undefined) {
                updates.push('title = ?');
                values.push(title);
            }
            if (config !== undefined) {
                const configStr = typeof config === 'string' ? config : JSON.stringify(config);
                updates.push('config = ?');
                values.push(configStr);
            }
            if (is_visible !== undefined) {
                updates.push('is_visible = ?');
                values.push(is_visible ? 1 : 0);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(id);
            await pool.query(`UPDATE homepage_sections SET ${updates.join(', ')} WHERE id = ?`, values);

            const [updatedRows] = await pool.query('SELECT * FROM homepage_sections WHERE id = ?', [id]);
            const updated = updatedRows[0];
            res.json({
                ...updated,
                config: JSON.parse(updated.config || '{}')
            });
        } catch (error) {
            next(error);
        }
    });

    // DELETE /api/homepage/:id (admin) — delete a section
    router.delete('/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const [existingRows] = await pool.query('SELECT * FROM homepage_sections WHERE id = ?', [id]);
            if (existingRows.length === 0) {
                return res.status(404).json({ error: 'Section not found' });
            }

            await pool.query('DELETE FROM homepage_sections WHERE id = ?', [id]);

            // Re-normalize sort_order after deletion
            const [remaining] = await pool.query('SELECT id FROM homepage_sections ORDER BY sort_order ASC');
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                for (let i = 0; i < remaining.length; i++) {
                    await conn.query('UPDATE homepage_sections SET sort_order = ? WHERE id = ?', [i, remaining[i].id]);
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            res.json({ message: 'Section deleted successfully' });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
