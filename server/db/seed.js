require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool, initDb } = require('./db');
const bcrypt = require('bcryptjs');

const categories = [
    { name: 'Almonds', slug: 'almonds', image_url: 'https://images.unsplash.com/photo-1631815333332-e3ffb24e2bf8?auto=format&fit=crop&q=80&w=600' },
    { name: 'Walnuts', slug: 'walnuts', image_url: 'https://images.unsplash.com/photo-1524593656068-fbac72624bb0?auto=format&fit=crop&q=80&w=600' },
    { name: 'Cashews', slug: 'cashews', image_url: 'https://images.unsplash.com/photo-1615485925873-7ecbbe90a866?auto=format&fit=crop&q=80&w=600' },
    { name: 'Pine Nuts', slug: 'pine-nuts', image_url: 'https://images.unsplash.com/photo-1543208541-0961a29a8c3d?auto=format&fit=crop&q=80&w=600' },
    { name: 'Dried Apricots', slug: 'dried-apricots', image_url: 'https://images.unsplash.com/photo-1595412017587-b7f3117dff54?auto=format&fit=crop&q=80&w=600' },
    { name: 'Dried Mulberries', slug: 'dried-mulberries', image_url: 'https://images.unsplash.com/photo-1534604361877-35f278ca3756?auto=format&fit=crop&q=80&w=600' },
    { name: 'Raisins', slug: 'raisins', image_url: 'https://images.unsplash.com/photo-1642102903918-b97c37955bbf?auto=format&fit=crop&q=80&w=600' },
    { name: 'Dates', slug: 'dates', image_url: 'https://images.unsplash.com/photo-1691657917109-c6e027eac44a?auto=format&fit=crop&q=80&w=600' },
    { name: 'Mixed Nuts', slug: 'mixed-nuts', image_url: 'https://images.unsplash.com/photo-1543158181-1274e5362710?auto=format&fit=crop&q=80&w=600' },
    { name: 'Pistachios', slug: 'pistachios', image_url: 'https://images.unsplash.com/photo-1502825751399-28baa9b81efe?auto=format&fit=crop&q=80&w=600' }
];

const products = [
    // ===== ALMONDS (2) =====
    {
        name: 'Premium Paper-Shell Almonds',
        slug: 'premium-paper-shell-almonds',
        description: 'High-quality naturally sun-dried almonds. Thin-shelled and rich in flavor with a satisfying crunch.',
        category_slug: 'almonds',
        image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=600',
        base_price: 650,
        stock: 50,
        weight_options: '[{"label":"250g","price":650},{"label":"500g","price":1250},{"label":"1kg","price":2450}]',
        is_featured: 1
    },
    {
        name: 'Mamra Almonds (Iranian Grade-A)',
        slug: 'mamra-almonds-iranian',
        description: 'Premium Iranian Mamra almonds known for their high oil content. Organically grown, naturally dried, and loaded with healthy fats.',
        category_slug: 'almonds',
        image_url: 'https://images.unsplash.com/photo-1600188999986-331bec5f9a8d?auto=format&fit=crop&q=80&w=600',
        base_price: 1200,
        stock: 30,
        weight_options: '[{"label":"250g","price":1200},{"label":"500g","price":2300},{"label":"1kg","price":4500}]',
        is_featured: 0
    },
    // ===== WALNUTS (2) =====
    {
        name: 'Premium Paper-Shell Walnuts',
        slug: 'premium-paper-shell-walnuts',
        description: 'Premium paper-shell walnuts. Easy to crack by hand, high oil content, and extremely nutritious. Omega-3 rich brain food.',
        category_slug: 'walnuts',
        image_url: 'https://images.unsplash.com/photo-1626012109496-21f579f648dd?auto=format&fit=crop&q=80&w=600',
        base_price: 1100,
        stock: 45,
        weight_options: '[{"label":"500g","price":1100},{"label":"1kg","price":2100}]',
        is_featured: 1
    },
    {
        name: 'Walnut Kernels (Halved & Peeled)',
        slug: 'walnut-kernels-halved',
        description: 'Ready-to-eat walnut kernel halves, carefully peeled and sorted. Perfect for baking, salads, and direct snacking.',
        category_slug: 'walnuts',
        image_url: 'https://images.unsplash.com/photo-1601966915100-b217f1420977?auto=format&fit=crop&q=80&w=600',
        base_price: 1600,
        stock: 35,
        weight_options: '[{"label":"250g","price":1600},{"label":"500g","price":3100},{"label":"1kg","price":6000}]',
        is_featured: 0
    },
    // ===== CASHEWS (2) =====
    {
        name: 'Roasted Salted Cashews (W320)',
        slug: 'roasted-salted-cashews',
        description: 'Jumbo-sized W320 grade cashews, perfectly roasted and lightly sea-salted. Premium crunch with the perfect balance of salt.',
        category_slug: 'cashews',
        image_url: 'https://images.unsplash.com/photo-1726771517475-e7acdd34cd8a?auto=format&fit=crop&q=80&w=600',
        base_price: 1550,
        stock: 60,
        weight_options: '[{"label":"250g","price":1550},{"label":"500g","price":3000},{"label":"1kg","price":5900}]',
        is_featured: 1
    },
    {
        name: 'Raw Whole Cashews (Natural)',
        slug: 'raw-whole-cashews',
        description: 'Unroasted, unsalted natural whole cashews. Ideal for cooking, making cashew milk, or healthy raw snacking.',
        category_slug: 'cashews',
        image_url: 'https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?auto=format&fit=crop&q=80&w=600',
        base_price: 1400,
        stock: 40,
        weight_options: '[{"label":"250g","price":1400},{"label":"500g","price":2700},{"label":"1kg","price":5200}]',
        is_featured: 0
    },
    // ===== PINE NUTS (2) =====
    {
        name: 'Chilgoza Pine Nuts (Chilas Grade-A)',
        slug: 'chilgoza-pine-nuts-chilas',
        description: '100% organic Chilgoza from ancient pine forests. Rich in healthy fats and uniquely flavored. A premium luxury.',
        category_slug: 'pine-nuts',
        image_url: 'https://images.unsplash.com/photo-1589752881818-337a265572df?auto=format&fit=crop&q=80&w=600',
        base_price: 3200,
        stock: 20,
        weight_options: '[{"label":"250g","price":3200},{"label":"500g","price":6300},{"label":"1kg","price":12500}]',
        is_featured: 1
    },
    {
        name: 'Shelled Chilgoza Kernels',
        slug: 'shelled-chilgoza-kernels',
        description: 'Pre-shelled Chilgoza pine nut kernels, ready to eat. Buttery, rich taste of premium pine nuts without the cracking effort.',
        category_slug: 'pine-nuts',
        image_url: 'https://images.unsplash.com/photo-1639447034101-e97deae5db52?auto=format&fit=crop&q=80&w=600',
        base_price: 5500,
        stock: 15,
        weight_options: '[{"label":"100g","price":5500},{"label":"250g","price":13500}]',
        is_featured: 1
    },
    // ===== DRIED APRICOTS (2) =====
    {
        name: 'Sun-Dried Apricots (Golden)',
        slug: 'sun-dried-apricots-golden',
        description: 'Golden, sweet and fleshy dried apricots from high-altitude orchards. No chemicals, 100% natural sun-drying process.',
        category_slug: 'dried-apricots',
        image_url: 'https://images.unsplash.com/photo-1723110565328-9dbeef603d19?auto=format&fit=crop&q=80&w=600',
        base_price: 750,
        stock: 100,
        weight_options: '[{"label":"500g","price":750},{"label":"1kg","price":1450}]',
        is_featured: 1
    },
    {
        name: 'Bitter Apricot Kernels (Organic)',
        slug: 'bitter-apricot-kernels',
        description: 'Organic bitter apricot kernels. Rich in Vitamin B17 and traditionally used as a health supplement.',
        category_slug: 'dried-apricots',
        image_url: 'https://images.unsplash.com/photo-1610401882421-f05386f4dfc5?auto=format&fit=crop&q=80&w=600',
        base_price: 550,
        stock: 55,
        weight_options: '[{"label":"250g","price":550},{"label":"500g","price":1050},{"label":"1kg","price":2000}]',
        is_featured: 0
    },
    // ===== DRIED MULBERRIES (2) =====
    {
        name: 'Sweet White Mulberries (Dried)',
        slug: 'sweet-white-mulberries',
        description: 'Chewy, candy-like dried white mulberries. A fantastic natural sweetener packed with iron and Vitamin C.',
        category_slug: 'dried-mulberries',
        image_url: 'https://images.unsplash.com/photo-1534604145734-329153788500?auto=format&fit=crop&q=80&w=600',
        base_price: 600,
        stock: 35,
        weight_options: '[{"label":"500g","price":600},{"label":"1kg","price":1150}]',
        is_featured: 0
    },
    {
        name: 'Black Mulberries (Shahtoot)',
        slug: 'black-mulberries-shahtoot',
        description: 'Dark, intensely sweet black mulberries naturally sun-dried. Rich in antioxidants and a rare traditional delicacy.',
        category_slug: 'dried-mulberries',
        image_url: 'https://images.unsplash.com/photo-1678019991559-3229dc722328?auto=format&fit=crop&q=80&w=600',
        base_price: 700,
        stock: 25,
        weight_options: '[{"label":"250g","price":700},{"label":"500g","price":1350}]',
        is_featured: 0
    },
    // ===== RAISINS (2) =====
    {
        name: 'Sundarkhani Green Raisins (Kishmish)',
        slug: 'sundarkhani-green-raisins',
        description: 'Long green seedless Sundarkhani raisins, naturally dried and highly nutritious. The premium Afghan-origin variety.',
        category_slug: 'raisins',
        image_url: 'https://images.unsplash.com/photo-1621597121291-fa650ac736e5?auto=format&fit=crop&q=80&w=600',
        base_price: 800,
        stock: 70,
        weight_options: '[{"label":"250g","price":800},{"label":"500g","price":1550},{"label":"1kg","price":3000}]',
        is_featured: 0
    },
    {
        name: 'Black Raisins (Monakka)',
        slug: 'black-raisins-monakka',
        description: 'Large, juicy black Monakka raisins with seeds. Known for boosting iron levels and improving digestion. A traditional health remedy.',
        category_slug: 'raisins',
        image_url: 'https://images.unsplash.com/photo-1608842850202-06e70ead4c10?auto=format&fit=crop&q=80&w=600',
        base_price: 650,
        stock: 55,
        weight_options: '[{"label":"250g","price":650},{"label":"500g","price":1250},{"label":"1kg","price":2400}]',
        is_featured: 0
    },
    // ===== DATES (2) =====
    {
        name: 'Premium Ajwa Dates (Madinah)',
        slug: 'premium-ajwa-dates',
        description: 'High grade, soft and luscious Ajwa dates from Madinah. Known as the king of dates, a timeless superfood and Sunnah fruit.',
        category_slug: 'dates',
        image_url: 'https://images.unsplash.com/photo-1629738601425-494c3d6ba3e2?auto=format&fit=crop&q=80&w=600',
        base_price: 2500,
        stock: 40,
        weight_options: '[{"label":"250g","price":2500},{"label":"500g","price":4800},{"label":"1kg","price":9500}]',
        is_featured: 1
    },
    {
        name: 'Medjool Dates (Jumbo)',
        slug: 'medjool-dates-jumbo',
        description: 'Extra large, caramel-soft Medjool dates. Known as the "king of dates" for their size and sweetness. Perfect for gifting.',
        category_slug: 'dates',
        image_url: 'https://images.unsplash.com/photo-1614061811858-dde54a522f5e?auto=format&fit=crop&q=80&w=600',
        base_price: 2200,
        stock: 50,
        weight_options: '[{"label":"250g","price":2200},{"label":"500g","price":4200},{"label":"1kg","price":8000}]',
        is_featured: 0
    },
    // ===== MIXED NUTS (2) =====
    {
        name: '5-Nut Power Mix (Premium)',
        slug: 'premium-5-nut-mix',
        description: 'A special power-packed blend of almonds, walnuts, cashews, pistachios, and raisins. The ultimate healthy trail mix.',
        category_slug: 'mixed-nuts',
        image_url: 'https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&q=80&w=600',
        base_price: 1800,
        stock: 65,
        weight_options: '[{"label":"500g","price":1800},{"label":"1kg","price":3500}]',
        is_featured: 1
    },
    {
        name: 'Dry Fruit Gift Box (Premium)',
        slug: 'dry-fruit-gift-box-premium',
        description: 'A luxurious gift box with 6 compartments: almonds, cashews, pistachios, walnuts, dates, and raisins. Perfect for Eid and weddings.',
        category_slug: 'mixed-nuts',
        image_url: 'https://images.unsplash.com/photo-1543158181-1274e5362710?auto=format&fit=crop&q=80&w=600',
        base_price: 3500,
        stock: 20,
        weight_options: '[{"label":"1kg Box","price":3500},{"label":"2kg Box","price":6800}]',
        is_featured: 1
    },
    // ===== PISTACHIOS (2) =====
    {
        name: 'Roasted Salted Pistachios (Irani)',
        slug: 'roasted-salted-pistachios',
        description: 'Premium roasted Iranian pistachios with a hint of Himalayan pink salt. Easy-to-open shells and a perfect crunch.',
        category_slug: 'pistachios',
        image_url: 'https://images.unsplash.com/photo-1704079662049-d00890d21a69?auto=format&fit=crop&q=80&w=600',
        base_price: 1850,
        stock: 80,
        weight_options: '[{"label":"250g","price":1850},{"label":"500g","price":3600},{"label":"1kg","price":7100}]',
        is_featured: 1
    },
    {
        name: 'Raw Pistachio Kernels (Unsalted)',
        slug: 'raw-pistachio-kernels',
        description: 'Shelled, natural pistachio kernels without salt or roasting. Vibrant green color, ideal for desserts, ice cream, and baking.',
        category_slug: 'pistachios',
        image_url: 'https://images.unsplash.com/photo-1551238875-13b9d38454db?auto=format&fit=crop&q=80&w=600',
        base_price: 2200,
        stock: 30,
        weight_options: '[{"label":"250g","price":2200},{"label":"500g","price":4300}]',
        is_featured: 0
    }
];

const ratingsList = [
    { rating: 4.9, review_count: 84 },
    { rating: 4.8, review_count: 56 },
    { rating: 4.6, review_count: 32 },
    { rating: 5.0, review_count: 112 },
    { rating: 4.7, review_count: 95 },
    { rating: 4.5, review_count: 19 },
    { rating: 4.8, review_count: 41 },
    { rating: 4.9, review_count: 148 },
    { rating: 4.9, review_count: 73 },
    { rating: 4.7, review_count: 62 },
    { rating: 4.6, review_count: 27 },
    { rating: 4.8, review_count: 88 },
    { rating: 4.5, review_count: 15 },
    { rating: 4.9, review_count: 102 },
    { rating: 4.7, review_count: 38 },
    { rating: 4.8, review_count: 67 },
    { rating: 4.6, review_count: 45 },
    { rating: 5.0, review_count: 91 },
    { rating: 4.9, review_count: 53 },
    { rating: 4.7, review_count: 79 }
];

/**
 * Reusable seeding function — can be called from CLI or from an HTTP route.
 * Accepts an existing pool connection so the caller controls the lifecycle.
 * Returns an object with counts of what was seeded.
 */
async function runSeed(dbPool) {
    // Clean out existing data before seeding (respect FK order)
    await dbPool.query('DELETE FROM order_items');
    await dbPool.query('DELETE FROM orders');
    await dbPool.query('DELETE FROM products');
    await dbPool.query('DELETE FROM categories');

    // Insert Categories
    const categoryMap = {};
    for (const c of categories) {
        const [result] = await dbPool.query('INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)', [c.name, c.slug, c.image_url || null]);
        categoryMap[c.slug] = result.insertId;
    }

    // Insert Products
    for (let idx = 0; idx < products.length; idx++) {
        const p = products[idx];
        const categoryId = categoryMap[p.category_slug];
        const rInfo = ratingsList[idx % ratingsList.length];
        await dbPool.query(`
          INSERT INTO products (
            name, slug, description, category_id, image_url, base_price, stock, weight_options, is_featured, rating, review_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            p.name, p.slug, p.description, categoryId, p.image_url,
            p.base_price, p.stock, p.weight_options, p.is_featured,
            rInfo.rating, rInfo.review_count
        ]);
    }

    // Clean up and Insert Admin User
    await dbPool.query('DELETE FROM admin_users');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe_' + Date.now();
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);

    await dbPool.query('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', [adminUsername, passwordHash]);

    const result = {
        categories: categories.length,
        products: products.length,
        adminUser: adminUsername
    };

    console.log(`Database seeding complete: Inserted ${result.categories} categories, ${result.products} products, and 1 admin user (${result.adminUser}).`);
    return result;
}

// Export for use by the HTTP seed-trigger route
module.exports = { runSeed };

// CLI entrypoint: `node db/seed.js`
if (require.main === module) {
    (async () => {
        try {
            await initDb();
            const result = await runSeed(pool);
            console.log('---');
            console.log('Admin username:', result.adminUser);
            if (process.env.ADMIN_PASSWORD) {
                console.log('Admin password was set from ADMIN_PASSWORD environment variable.');
            } else {
                console.warn('WARNING: No ADMIN_PASSWORD env var set. A random default was used.');
                console.warn('Re-run with: ADMIN_PASSWORD=YourSecurePass node db/seed.js');
            }
            console.log('---');
        } catch (err) {
            console.error('Seed failed:', err.message);
            process.exit(1);
        } finally {
            await pool.end();
        }
    })();
}
