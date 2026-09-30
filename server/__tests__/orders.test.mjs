import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function createTestApp() {
    process.env.JWT_SECRET = 'test_secret_key_for_vitest_testing_only_64chars_long_enough_here';
    process.env.NODE_ENV = 'test';

    const app = express();
    app.use(express.json());

    const db = require('../db/db');
    const requireAdmin = require('../middleware/requireAdmin');
    const ordersRoutes = require('../routes/orders');

    app.use('/api/orders', ordersRoutes(db, requireAdmin));

    // Error handler for tests
    app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
    });

    return { app, db };
}

describe('Orders Endpoints', () => {
    const { app } = createTestApp();

    it('POST /api/orders should reject empty body', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('POST /api/orders should reject missing customer fields', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({ items: [{ product_id: 1, quantity: 1 }] });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
    });

    it('POST /api/orders should reject empty items array', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({
                customer_name: 'Test User',
                phone: '03001234567',
                address: 'Test Address',
                items: []
            });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('at least one item');
    });

    it('GET /api/orders should require admin auth', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.status).toBe(401);
    });

    it('PATCH /api/orders/999/status should require admin auth', async () => {
        const res = await request(app)
            .patch('/api/orders/999/status')
            .send({ status: 'Processing' });
        expect(res.status).toBe(401);
    });
});
