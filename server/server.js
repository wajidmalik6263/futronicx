require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getUploadMiddleware, isCloudinaryConfigured } = require('./config/cloudinary');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const xss = require('xss');
const morgan = require('morgan');
const { pool, initDb } = require('./db/db');
const { runSeed } = require('./db/seed');
const requireAdmin = require('./middleware/requireAdmin');
const { safeErrorMessage } = require('./helpers');
const { initWebSocket, broadcastToAdmins } = require('./services/websocketService');

// ==========================================
// NEXT.JS CUSTOM SERVER INTEGRATION
// ==========================================
// Next.js renders all pages (SSR/ISR/static). Express handles only /api/*,
// /uploads, /sitemap.xml, /robots.txt — everything else is delegated to Next.
const next = require(path.join(__dirname, '..', 'client', 'node_modules', 'next'));
const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
    dir: path.join(__dirname, '..', 'client'),
});
const nextHandler = nextApp.getRequestHandler();

// ==========================================
// C1: XSS SANITIZATION HELPER
// ==========================================
const sanitizeValue = (val) => {
    if (typeof val === 'string') return xss(val);
    if (Array.isArray(val)) return val.map(sanitizeValue);
    if (val && typeof val === 'object') {
        const cleaned = {};
        for (const [k, v] of Object.entries(val)) {
            cleaned[k] = sanitizeValue(v);
        }
        return cleaned;
    }
    return val;
};

// ==========================================
// STARTUP VALIDATION
// ==========================================
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('replace_this')) {
    console.error('FATAL: JWT_SECRET environment variable is not set or is still the default placeholder. Please set a secure value in your .env file.');
    process.exit(1);
}

if (isCloudinaryConfigured()) {
    console.log('✅ Using Cloudinary for image storage');
} else {
    console.log('⚠️ Using local disk storage (dev fallback) — set CLOUDINARY_* env vars in .env for production');
}

const app = express();

// ==========================================
// S0: TRUST PROXY (REQUIRED FOR RATE LIMITING BEHIND REVERSE PROXIES)
// ==========================================
// Enable trusting the immediate proxy so `express-rate-limit` identifies client IPs
// correctly (avoids blocking all users as one IP when deployed on Render, Vercel, etc.)
app.set('trust proxy', 1);

// ==========================================
// S4: SECURITY HEADERS (Helmet)
// ==========================================
// A real Content-Security-Policy replaces the previous `contentSecurityPolicy: false`.
// The directives below whitelist exactly the external origins the storefront uses
// (Cloudinary for images, Google Fonts for CSS + font files, same-origin WebSocket
// for the admin live feed) and lock down everything else. This closes the "CSP
// disabled" gap while remaining fully compatible with the current SPA:
//   - style-src allows 'unsafe-inline' because Tailwind + inline <style> need it.
//   - script-src allows 'unsafe-inline' for the small inline font-swap handler
//     and react-helmet-async's injected JSON-LD; no external script hosts are
//     permitted, so arbitrary third-party scripts are still blocked.
//   - object-src 'none', frame-ancestors 'none' and base-uri 'self' block
//     clickjacking, plugin embedding and <base> hijacking.
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            // Inline handler (font media swap) + injected JSON-LD; no remote scripts.
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            // Tailwind / inline styles + Google Fonts stylesheet.
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            // Google Fonts font files.
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            // Product/hero imagery from Cloudinary, plus data/blob URIs and same-origin uploads.
            imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
            // XHR/fetch to the same-origin API + same-origin WebSocket (ws/wss).
            connectSrc: ["'self'", 'ws:', 'wss:'],
            // Do not force HTTPS upgrades in local dev; safe on HTTPS in prod.
            upgradeInsecureRequests: null,
        },
    },
}));

// ==========================================
// PERF: RESPONSE COMPRESSION (gzip / brotli-via-proxy fallback)
// ==========================================
// Compresses HTML, JS, CSS and JSON API responses. This directly addresses the
// Lighthouse "No compression applied" audit and shrinks text payloads ~70%.
app.use(compression({
    level: 6,
    threshold: 1024, // don't waste CPU compressing tiny responses
}));

// ==========================================
// SEO: DYNAMIC sitemap.xml & robots.txt (MUST come before express.static)
// ==========================================
// These are registered ahead of the static middleware so the dynamically
// generated sitemap (which includes every product & blog URL) always wins
// over any stale sitemap.xml that may exist in the build output (client/dist).
app.use('/sitemap.xml', require('./routes/sitemap')(pool));
app.use('/robots.txt', require('./routes/robots')(pool));
// llms.txt served with explicit text/markdown so agentic-browsing audits get
// the Markdown document (never the SPA index.html fallback). Generated
// dynamically from the DB (categories, prices, policies) with a static fallback.
app.use('/llms.txt', require('./routes/llms')(pool));
// llms-full.txt provides deep full-text content (product descriptions, blog
// articles, region FAQs, policies) for AI crawlers that want more than a directory.
app.use('/llms-full.txt', require('./routes/llms-full')(pool));

// F10: Structured HTTP request logging
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

// ==========================================
// S5: STRICT CORS CONFIGURATION
// ==========================================
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim());

// Also allow same-origin requests (for single-service deployment where
// the React frontend is served by the same Express server).
// This is handled dynamically in the origin callback below.
app.use(cors({
    origin: function (origin, callback) {
        // No origin header = same-origin or non-browser request → allow
        if (!origin) return callback(null, true);
        // Explicitly allowed origins from env
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// ==========================================
// S8: JSON BODY SIZE LIMIT
// ==========================================
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// C1: Sanitize all incoming request body strings
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    next();
});

// ==========================================
// STATIC FILE SERVING
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// S6 & S7: SECURE MULTER CONFIG 
// ==========================================
const upload = getUploadMiddleware('general');

// ==========================================
// S3: RATE LIMITING
// ==========================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', generalLimiter);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', ['store_name']);
        const storeName = (rows.length > 0 && rows[0].value) ? rows[0].value : 'North Dry Fruits';
        res.json({ status: `${storeName} API is running`, database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'API is running', database: 'disconnected' });
    }
});

// ==========================================
// C2: MOUNT ROUTE MODULES
// ==========================================
app.use('/api/auth', require('./routes/auth')(pool, requireAdmin, authLimiter));
app.use('/api/upload', require('./routes/upload')(pool, requireAdmin, upload));
app.use('/api/settings', require('./routes/settings')(pool, requireAdmin));
app.use('/api/categories', require('./routes/categories')(pool, requireAdmin));
app.use('/api/products', require('./routes/products')(pool, requireAdmin));
app.use('/api/orders', require('./routes/orders')(pool, requireAdmin, broadcastToAdmins));
app.use('/api/contact', require('./routes/contact')(pool));
app.use('/api/homepage', require('./routes/homepage')(pool, requireAdmin));
app.use('/api/payments', require('./routes/payments')(pool, requireAdmin, upload));
app.use('/api/chatbot', require('./routes/chatbot')(pool));
app.use('/api/reviews', require('./routes/reviews')(pool, requireAdmin));
app.use('/api/blogs', require('./routes/blogs')(pool));
app.use('/api/locations', require('./routes/locations')(pool));
app.use('/api/admin/blogs', require('./routes/adminBlogs')(pool, requireAdmin, upload));
// Note: /sitemap.xml and /robots.txt are registered earlier, before express.static,
// so the dynamic versions take precedence over any stale files in client/dist.

// ==========================================
// TEMPORARY: One-time remote seed trigger for Hostinger deployment.
// ⚠️  Remove this route after first successful use in production.
// ==========================================
let seedHasRun = false;
app.get('/api/run-seed-once', async (req, res) => {
    const triggerKey = process.env.SEED_TRIGGER_KEY;
    if (!triggerKey || req.query.key !== triggerKey) {
        console.warn(`[SEED-TRIGGER] Rejected — invalid or missing key from ${req.ip}`);
        return res.status(403).json({ error: 'Forbidden — invalid key' });
    }
    if (seedHasRun) {
        console.warn('[SEED-TRIGGER] Rejected — seed has already been executed this server session');
        return res.status(409).json({ error: 'Seed has already been run during this server process. Restart the server to allow again.' });
    }
    try {
        console.log(`[SEED-TRIGGER] Starting seed via HTTP trigger from ${req.ip}...`);
        seedHasRun = true; // set before running to prevent concurrent requests
        const result = await runSeed(pool);
        console.log('[SEED-TRIGGER] Seed completed successfully:', result);
        res.json({
            success: true,
            message: 'Database seeded successfully',
            seeded: {
                categories: result.categories,
                products: result.products,
                adminUser: result.adminUser
            }
        });
    } catch (err) {
        seedHasRun = false; // allow retry on failure
        console.error('[SEED-TRIGGER] Seed failed:', err.message);
        res.status(500).json({ error: 'Seed failed: ' + err.message });
    }
});

// ==========================================
// C7: API 404 CATCH-ALL
// ==========================================
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// ==========================================
// SEO: 301 REDIRECT LEGACY CATEGORY URLs
// ==========================================
// Old query-param category URLs (/products?category=apricots) are permanently
// redirected to the new clean path form (/products/apricots) so search engines
// consolidate ranking signals and never index duplicate content. Any other
// query params (e.g. ?search=) are preserved.
app.get('/products', (req, res, next) => {
    const category = req.query.category;
    if (!category) return next();

    const rest = { ...req.query };
    delete rest.category;
    const qs = new URLSearchParams(rest).toString();

    // Sanitize the slug to a safe URL segment.
    const safeSlug = String(category).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const target = category === 'all'
        ? `/products${qs ? `?${qs}` : ''}`
        : `/products/${safeSlug}${qs ? `?${qs}` : ''}`;

    return res.redirect(301, target);
});

// ==========================================
// SEO: 301 REDIRECT LEGACY BLOG QUERY URLs
// ==========================================
function toSlug(str) {
    return String(str)
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim()
        .replace(/[+_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

app.get('/blog', async (req, res, next) => {
    const { category, page, q } = req.query;
    if (!category && !page) return next();
    if (q && !category && !page) return next();

    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    let categorySegment = '';
    if (category && String(category).toLowerCase() !== 'all') {
        let resolvedSlug = toSlug(category);
        try {
            const [rows] = await pool.query(
                'SELECT slug FROM blog_categories WHERE slug = ? OR name = ? LIMIT 1',
                [resolvedSlug, category]
            );
            if (rows.length && rows[0].slug) resolvedSlug = rows[0].slug;
        } catch {
            // On DB error fall back to the sanitized slug rather than 500.
        }
        categorySegment = `/${resolvedSlug}`;
    }

    const base = `/blog${categorySegment}`;
    const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
    const target = pageNum > 1 ? `${base}/page/${pageNum}${suffix}` : `${base}${suffix}`;

    return res.redirect(301, target);
});

// ==========================================
// NEXT.JS: CATCH-ALL FOR PAGE RENDERING
// ==========================================
// Every non-API, non-upload request is delegated to Next.js. This replaces
// the old express.static + SPA catch-all + prerender + seoStatus middleware.
// Next.js handles SSR, ISR, static assets (_next/static), 404s, metadata
// injection, and all page routes natively through its App Router.
app.all('/{*path}', (req, res) => {
    return nextHandler(req, res);
});

// ==========================================
// S9 & C10: GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl}:`, err.message);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    if (err.message.includes('Only JPEG') || err.message.includes('Only images')) {
        return res.status(400).json({ error: err.message });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal server error' : safeErrorMessage(err)
    });
});

// ==========================================
// START SERVER (async — waits for DB init)
// ==========================================
const PORT = process.env.PORT || 5000;

(async () => {
    try {
        // Prepare Next.js (compiles pages in dev, loads build output in prod)
        await nextApp.prepare();
        console.log('✅ Next.js ready');

        await initDb();
        const server = http.createServer(app);
        // Initialize WebSocket on the same HTTP server
        initWebSocket(server);
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('FATAL: Failed to initialize:', err.message);
        process.exit(1);
    }
})();