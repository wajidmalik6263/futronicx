const express = require('express');

const { getUploadMiddleware, isCloudinaryConfigured } = require('../config/cloudinary');
const uploadReceipts = getUploadMiddleware('receipts');

module.exports = function (pool, requireAdmin, _legacyUpload) {
    const router = express.Router();

    // POST /api/payments/receipt-upload (public — customers upload payment screenshots)
    router.post('/receipt-upload', uploadReceipts.single('image'), (req, res, next) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No image provided' });

            let imageUrl;
            if (isCloudinaryConfigured()) {
                imageUrl = req.file.path;
            } else {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            res.status(201).json({ url: imageUrl });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/payments/methods (public — available payment methods for checkout)
    router.get('/methods', async (req, res, next) => {
        try {
            // COD is always available
            const methods = [
                { id: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives', color: null }
            ];
            // Derive additional methods from active payment accounts
            const [activeAccounts] = await pool.query('SELECT DISTINCT method, title FROM payment_accounts WHERE is_active = 1');
            const METHOD_META = {
                'easypaisa': { label: 'Easypaisa', description: 'Send via Easypaisa & upload receipt', color: '#4CAF50' },
                'jazzcash': { label: 'JazzCash', description: 'Send via JazzCash & upload receipt', color: '#E4002B' },
                'bank_transfer': { label: 'Bank Transfer', description: 'Transfer to our bank account', color: '#1565C0' },
            };
            const seen = new Set();
            for (const acc of activeAccounts) {
                if (!seen.has(acc.method)) {
                    seen.add(acc.method);
                    const meta = METHOD_META[acc.method] || { label: acc.title || acc.method, description: 'Upload payment receipt', color: '#666' };
                    methods.push({ id: acc.method, label: meta.label, description: meta.description, color: meta.color });
                }
            }
            res.json(methods);
        } catch (error) {
            next(error);
        }
    });

    // GET /api/payments/accounts (public — for checkout display)
    router.get('/accounts', async (req, res, next) => {
        try {
            const [accounts] = await pool.query('SELECT id, method, title, account_number, account_name, instructions FROM payment_accounts WHERE is_active = 1');
            res.json(accounts);
        } catch (error) {
            next(error);
        }
    });

    // GET /api/payments/accounts/admin (admin — all accounts)
    router.get('/accounts/admin', requireAdmin, async (req, res, next) => {
        try {
            const [accounts] = await pool.query('SELECT * FROM payment_accounts ORDER BY created_at DESC');
            res.json(accounts);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/payments/accounts (admin — add new account)
    router.post('/accounts', requireAdmin, async (req, res, next) => {
        try {
            const { method, title, account_number, account_name, instructions } = req.body;
            if (!method || !title || !account_number || !account_name) {
                return res.status(400).json({ error: 'Method, title, account number, and account name are required' });
            }
            const [result] = await pool.query('INSERT INTO payment_accounts (method, title, account_number, account_name, instructions) VALUES (?, ?, ?, ?, ?)', [method, title, account_number, account_name, instructions || '']);
            res.status(201).json({ id: result.insertId, message: 'Payment account added' });
        } catch (error) {
            next(error);
        }
    });

    // PUT /api/payments/accounts/:id (admin — update account)
    router.put('/accounts/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const { method, title, account_number, account_name, instructions, is_active } = req.body;
            const [result] = await pool.query('UPDATE payment_accounts SET method = ?, title = ?, account_number = ?, account_name = ?, instructions = ?, is_active = ? WHERE id = ?', [method, title, account_number, account_name, instructions || '', is_active !== undefined ? is_active : 1, id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment account not found' });
            res.json({ message: 'Payment account updated' });
        } catch (error) {
            next(error);
        }
    });

    // DELETE /api/payments/accounts/:id (admin — remove account)
    router.delete('/accounts/:id', requireAdmin, async (req, res, next) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM payment_accounts WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment account not found' });
            res.json({ message: 'Payment account removed' });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
