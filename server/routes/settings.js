const express = require('express');

module.exports = function (pool, requireAdmin) {
    const router = express.Router();

    // GET /api/settings (public)
    router.get('/', async (req, res, next) => {
        try {
            const [settingsRows] = await pool.query('SELECT * FROM settings');
            const settingsObj = {};
            for (let row of settingsRows) {
                settingsObj[row.key] = row.value;
            }
            res.json(settingsObj);
        } catch (error) {
            next(error);
        }
    });

    // PUT /api/settings (admin)
    router.put('/', requireAdmin, async (req, res, next) => {
        try {
            const payload = req.body;
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                for (const [key, value] of Object.entries(payload)) {
                    await conn.query(
                        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
                        [key, typeof value === 'string' ? value : String(value)]
                    );
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

            const [settingsRows] = await pool.query('SELECT * FROM settings');
            const settingsObj = {};
            for (let row of settingsRows) {
                settingsObj[row.key] = row.value;
            }
            res.json(settingsObj);
        } catch (error) {
            next(error);
        }
    });

    return router;
};
