#!/usr/bin/env node
/**
 * PRODUCT ORIGIN AUDIT / UPDATE
 * ==========================================================================
 * The region landing pages (/dry-fruits-skardu, etc.) list a product ONLY if
 * that product's `origin` column matches the region. This script helps you
 * see coverage and apply YOUR verified origins — it never guesses an origin.
 *
 * Run from the `server` directory so it picks up the same .env / DB config as
 * the app (it reuses server/db/db.js's connection settings via env vars).
 *
 * USAGE
 * -----
 *   1) Report only (safe, read-only) — the default:
 *        node scripts/auditProductOrigins.js
 *
 *   2) Write a template mapping of every product to fill in by hand:
 *        node scripts/auditProductOrigins.js --export origins.json
 *      Then edit origins.json, setting a real `origin` string for each product
 *      you can VERIFY (leave blank/remove entries you can't verify).
 *
 *   3) Apply a mapping you filled in (updates only the listed slugs):
 *        node scripts/auditProductOrigins.js --apply origins.json
 *      Add --dry-run to preview the UPDATEs without writing:
 *        node scripts/auditProductOrigins.js --apply origins.json --dry-run
 *
 * The mapping file format is: { "<product-slug>": "<origin text>", ... }
 * e.g. { "authentic-skardu-apricots-...": "Skardu, Gilgit-Baltistan" }
 *
 * IMPORTANT: only set origins you can factually verify. This script will not
 * invent, infer, or auto-fill origins from names.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// The region match terms the site uses, so the report can show which regions
// each product would surface under. Mirrors server/utils/locationSeo.js.
let LOCATION_SEO = {};
try {
    ({ LOCATION_SEO } = require('../utils/locationSeo'));
} catch {
    LOCATION_SEO = {};
}

function parseArgs(argv) {
    const args = { report: true, dryRun: false, exportPath: null, applyPath: null };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--export') { args.exportPath = argv[++i]; args.report = false; }
        else if (a === '--apply') { args.applyPath = argv[++i]; args.report = false; }
        else if (a === '--dry-run') { args.dryRun = true; }
    }
    return args;
}

function regionsForOrigin(origin) {
    const o = String(origin || '').toLowerCase();
    if (!o) return [];
    const hits = [];
    for (const [slug, loc] of Object.entries(LOCATION_SEO)) {
        const terms = Array.isArray(loc.originMatch) ? loc.originMatch : [];
        if (terms.some((t) => o.includes(String(t).toLowerCase()))) hits.push(loc.region || slug);
    }
    return hits;
}

async function main() {
    const args = parseArgs(process.argv);
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gbmarket',
        charset: 'utf8mb4',
        dateStrings: true,
    });

    try {
        const [rows] = await pool.query(
            `SELECT id, name, slug, origin FROM products
             WHERE (is_deleted IS NULL OR is_deleted = 0)
             ORDER BY name ASC`
        );

        // --- REPORT (default) ---------------------------------------------
        if (args.report) {
            const withOrigin = rows.filter((r) => r.origin && String(r.origin).trim());
            const without = rows.filter((r) => !r.origin || !String(r.origin).trim());

            console.log(`\nProduct origin coverage: ${withOrigin.length}/${rows.length} have an origin set.\n`);

            if (withOrigin.length) {
                console.log('Products WITH an origin (and the region pages they surface on):');
                for (const r of withOrigin) {
                    const regions = regionsForOrigin(r.origin);
                    console.log(`  • ${r.name}\n      origin: "${r.origin}"  →  ${regions.length ? regions.join(', ') : '(no region match)'}`);
                }
                console.log('');
            }
            if (without.length) {
                console.log('Products WITHOUT an origin (will NOT appear on any region page):');
                for (const r of without) console.log(`  • ${r.name}  [slug: ${r.slug}]`);
                console.log('');
            }
            console.log('Tip: run with --export origins.json to create a fill-in template.\n');
            return;
        }

        // --- EXPORT TEMPLATE ---------------------------------------------
        if (args.exportPath) {
            const map = {};
            for (const r of rows) map[r.slug] = r.origin || '';
            const out = path.resolve(process.cwd(), args.exportPath);
            fs.writeFileSync(out, JSON.stringify(map, null, 2), 'utf8');
            console.log(`Wrote template with ${rows.length} products to ${out}`);
            console.log('Fill in a verified origin string for each product you can confirm, then run --apply.');
            return;
        }

        // --- APPLY MAPPING ------------------------------------------------
        if (args.applyPath) {
            const inPath = path.resolve(process.cwd(), args.applyPath);
            const map = JSON.parse(fs.readFileSync(inPath, 'utf8'));
            const slugSet = new Set(rows.map((r) => r.slug));
            let updates = 0, skipped = 0;
            for (const [slug, origin] of Object.entries(map)) {
                const val = String(origin || '').trim();
                if (!val) { skipped++; continue; }            // blank = leave unchanged
                if (!slugSet.has(slug)) {
                    console.warn(`  ! unknown slug, skipping: ${slug}`);
                    skipped++;
                    continue;
                }
                if (args.dryRun) {
                    console.log(`  [dry-run] would set origin of ${slug} = "${val}"`);
                } else {
                    await pool.query('UPDATE products SET origin = ? WHERE slug = ?', [val, slug]);
                    console.log(`  updated ${slug} → "${val}"`);
                }
                updates++;
            }
            console.log(`\n${args.dryRun ? 'Would update' : 'Updated'} ${updates} product(s); skipped ${skipped}.`);
            return;
        }
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error('Origin audit failed:', err.message);
    process.exit(1);
});
