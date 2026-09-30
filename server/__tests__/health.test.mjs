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

    app.get('/api/health', (req, res) => {
        try {
            db.prepare('SELECT 1').get();
            const storeName = db.prepare('SELECT value FROM settings WHERE key = ?').get('store_name')?.value || 'North Dry Fruits';
            res.json({ status: `${storeName} API is running`, database: 'connected' });
        } catch (error) {
            res.status(503).json({ status: 'API is running', database: 'disconnected' });
        }
    });

    return { app, db };
}

describe('Health Check Endpoint', () => {
    const { app } = createTestApp();

    it('GET /api/health should return 200 with status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toContain('API is running');
        expect(res.body).toHaveProperty('database', 'connected');
    });
});
