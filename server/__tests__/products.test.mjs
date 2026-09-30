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
    const productsRoutes = require('../routes/products');

    app.use('/api/products', productsRoutes(db, requireAdmin));

    return { app, db };
}

describe('Products Endpoints', () => {
    const { app } = createTestApp();

    it('GET /api/products should return products array with pagination', async () => {
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('products');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('GET /api/products should support category filter', async () => {
        const res = await request(app).get('/api/products?category=nonexistent-slug');
        expect(res.status).toBe(200);
        expect(res.body.products).toEqual([]);
        expect(res.body.pagination.total).toBe(0);
    });

    it('GET /api/products should support search query', async () => {
        const res = await request(app).get('/api/products?search=zzz_no_match_zzz');
        expect(res.status).toBe(200);
        expect(res.body.products).toEqual([]);
    });

    it('GET /api/products/:slug should return 404 for non-existent product', async () => {
        const res = await request(app).get('/api/products/this-product-does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Product not found');
    });

    it('POST /api/products should require auth', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ name: 'Test', slug: 'test', base_price: 100 });
        expect(res.status).toBe(401);
    });
});
