const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gbmarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // Return date columns as strings instead of JS Date objects (matches SQLite behaviour)
  dateStrings: true,
  // Return DECIMAL/NUMERIC columns as JS numbers instead of strings (matches SQLite REAL behaviour)
  decimalNumbers: true
});

async function initDb() {
  console.log(`Connecting to MySQL database "${process.env.DB_NAME || 'gbmarket'}" at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);

  // ── TABLE CREATION ──────────────────────────────────────────────

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      image_url TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      category_id INT,
      image_url TEXT,
      gallery_images TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      weight_options TEXT,
      is_featured TINYINT(1) DEFAULT 0,
      is_deleted TINYINT(1) DEFAULT 0,
      is_new TINYINT(1) DEFAULT 0,
      rating DECIMAL(3,1) DEFAULT 0,
      review_count INT DEFAULT 0,
      origin VARCHAR(255),
      shelf_life VARCHAR(255),
      storage_instructions TEXT,
      discount_percent INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255),
      phone VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      payment_method VARCHAR(50) DEFAULT 'COD',
      payment_proof TEXT,
      payment_status VARCHAR(50) DEFAULT 'Unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      product_name VARCHAR(255) NOT NULL,
      weight_option VARCHAR(100),
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(255) UNIQUE NOT NULL,
      value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT '',
      config TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_visible TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      method VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      account_number VARCHAR(255) NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      instructions TEXT DEFAULT '',
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255),
      rating INT NOT NULL,
      title VARCHAR(255),
      comment TEXT,
      is_approved TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CHECK (rating >= 1 AND rating <= 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT,
      content LONGTEXT,
      image_url TEXT,
      category_id INT,
      author VARCHAR(255) DEFAULT 'Admin',
      tags TEXT,
      is_published TINYINT(1) DEFAULT 0,
      views INT DEFAULT 0,
      meta_title VARCHAR(255),
      meta_description TEXT,
      read_time INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Migration: add columns if they don't exist (for existing databases)
  const [blogCols] = await pool.query(`SHOW COLUMNS FROM blogs LIKE 'meta_title'`);
  if (blogCols.length === 0) {
    await pool.query(`ALTER TABLE blogs ADD COLUMN meta_title VARCHAR(255) AFTER views`);
    await pool.query(`ALTER TABLE blogs ADD COLUMN meta_description TEXT AFTER meta_title`);
    await pool.query(`ALTER TABLE blogs ADD COLUMN read_time INT AFTER meta_description`);
  }

  console.log('Database schema initialized.');

  // ── SEED DEFAULT SETTINGS ───────────────────────────────────────

  // Migration: insert settings keys if they don't exist
  const settingsToMigrate = [
    { key: 'site_url', val: '' },
    { key: 'working_hours', val: 'Mon - Sat: 9:00 AM - 8:00 PM' },
    { key: 'map_embed_url', val: '' },
    { key: 'privacy_policy_content', val: '<h2 class="text-xl font-bold text-[#3A2E1F] my-4">1. Introduction</h2><p class="mb-4">We value your privacy and are committed to protecting your personal data...</p><h2 class="text-xl font-bold text-[#3A2E1F] my-4">Contact Us</h2><p class="mb-4">If you have any questions, please contact us.</p>' },
    { key: 'about_hero_heading', val: 'Welcome to Our Store' },
    { key: 'about_hero_subheading', val: 'We are dedicated to bringing you the finest quality products, sourced with care and delivered to your doorstep.' },
    { key: 'about_story_heading', val: 'Our Story' },
    { key: 'about_story_text', val: 'We are passionate about delivering the highest quality products to our customers. Every item in our collection is carefully sourced and quality-checked to ensure you receive nothing but the best.\n\nOur commitment to excellence means we work directly with trusted suppliers, ensuring authenticity and freshness in every order.' },
    { key: 'currency_code', val: 'USD' },
    { key: 'locale', val: 'en_US' },
    { key: 'default_shipping_fee', val: '0' },
    { key: 'shipping_info_text', val: 'Orders dispatched within 24 hours.\nDelivery time: 2–3 business days.\nFree shipping on all orders — no delivery charges.\nTracked delivery via courier service.' },
    { key: 'order_prefix', val: 'GB' },
    { key: 'sku_prefix', val: 'GBM' },
    { key: 'phone_pattern', val: '^(\\d{10,15}|\\+\\d{10,15})$' },
    { key: 'phone_placeholder', val: 'Phone Number' },
    { key: 'search_placeholder', val: 'Search products...' },
    { key: 'chatbot_name', val: 'AI Assistant' },
    { key: 'footer_tagline', val: 'Crafted with love for healthy living' },
    { key: 'footer_feature_1_title', val: 'Free Express Shipping' },
    { key: 'footer_feature_1_text', val: 'Free on all orders — no charges' },
    { key: 'footer_feature_2_title', val: '100% Quality Guaranteed' },
    { key: 'footer_feature_2_text', val: 'Direct from trusted sources' },
    { key: 'footer_feature_3_title', val: '7-Day Fresh Guarantee' },
    { key: 'footer_feature_3_text', val: '100% money back or replacement' },
    { key: 'product_badge_text', val: '100% Organic' },
    { key: 'empty_cart_text', val: "Looks like you haven't added any products to your cart yet." },
    { key: 'shipping_tab_heading', val: 'Nationwide Delivery' },
    { key: 'shipping_bullet_1', val: 'Orders dispatched within 24 hours.' },
    { key: 'shipping_bullet_2', val: 'Delivery time: 2–3 business days.' },
    { key: 'shipping_bullet_3', val: 'Free shipping on all orders — no delivery charges.' },
    { key: 'shipping_bullet_4', val: 'Tracked delivery via courier service.' }
  ];

  for (const s of settingsToMigrate) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM settings WHERE `key` = ?', [s.key]);
    if (rows[0].count === 0) {
      await pool.query('INSERT INTO settings (`key`, value) VALUES (?, ?)', [s.key, s.val]);
    }
  }

  // Seed initial settings if table is completely empty
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM settings');
  if (countRows[0].count === 0) {
    const seedSettings = {
      store_name: 'North Dry Fruits',
      store_tagline: 'Premium organic dry fruits & nuts from Gilgit-Baltistan',
      site_url: '',
      logo_url: '/placeholder.png',
      favicon_url: '/vite.svg',
      footer_logo_url: '/placeholder.png',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      working_hours: 'Mon - Sat: 9:00 AM - 8:00 PM',
      map_embed_url: '',
      hero_heading: 'Premium Organic Dry Fruits & Nuts From the Mountains.',
      hero_subheading: '100% authentic, sun-dried dry fruits sourced directly from Gilgit-Baltistan farmers.',
      hero_image_url: 'https://images.unsplash.com/photo-1596769062638-e6ed3f46f496?auto=format&fit=crop&q=80&w=1200',
      social_facebook: '',
      social_instagram: '',
      social_twitter: '',
      social_youtube: '',
      social_linkedin: '',
      social_whatsapp: '',
      footer_about_text: 'Your trusted source for 100% authentic, sun-dried organic dry fruits and nuts, sourced directly from the mountain farmers of Gilgit-Baltistan and delivered to your doorstep.',
      currency_symbol: '$ ',
      currency_code: 'USD',
      locale: 'en_US',
      free_shipping_threshold: '0',
      default_shipping_fee: '0',
      shipping_info_text: 'Orders dispatched within 24 hours.\nDelivery time: 2–3 business days.\nFree shipping on all orders — no delivery charges.\nTracked delivery via courier service.',
      shipping_tab_heading: 'Nationwide Delivery',
      shipping_bullet_1: 'Orders dispatched within 24 hours.',
      shipping_bullet_2: 'Delivery time: 2–3 business days.',
      shipping_bullet_3: 'Free shipping on all orders — no delivery charges.',
      shipping_bullet_4: 'Tracked delivery via courier service.',
      order_prefix: 'ORD',
      sku_prefix: 'SKU',
      phone_pattern: '^(\\d{10,15}|\\+\\d{10,15})$',
      phone_placeholder: 'Phone Number',
      search_placeholder: 'Search products...',
      chatbot_name: 'AI Assistant',
      footer_tagline: 'Crafted with care for quality living',
      footer_feature_1_title: 'Free Express Shipping',
      footer_feature_1_text: 'Free on all orders — no charges',
      footer_feature_2_title: '100% Quality Guaranteed',
      footer_feature_2_text: 'Direct from trusted sources',
      footer_feature_3_title: '7-Day Satisfaction Guarantee',
      footer_feature_3_text: '100% money back or replacement',
      product_badge_text: 'Premium Quality',
      empty_cart_text: "Looks like you haven't added any products to your cart yet.",
      privacy_policy_content: '<h2 class="text-xl font-bold text-[#3A2E1F] my-4">1. Introduction</h2><p class="mb-4">We value your privacy and are committed to protecting your personal data...</p><h2 class="text-xl font-bold text-[#3A2E1F] my-4">Contact Us</h2><p class="mb-4">If you have any questions, please contact us.</p>',
      about_hero_heading: 'Welcome to North Dry Fruits',
      about_hero_subheading: 'Bringing 100% authentic, sun-dried organic dry fruits and nuts directly from the mountain farmers of Gilgit-Baltistan to your doorstep across Pakistan.',
      about_story_heading: 'Sourced From High Altitude Orchards of Gilgit-Baltistan',
      about_story_text: 'North Dry Fruits was founded with a simple mission — to bring the purest, most nutritious dry fruits from the valleys of Gilgit-Baltistan directly to families across Pakistan.\n\nOur products are hand-picked from high-altitude orchards where the clean mountain air and natural sunlight produce the richest flavors. We work directly with local farmers, cutting out middlemen to ensure freshness, fair pricing, and authenticity in every pack.',
      about_story_image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800'
    };

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [key, value] of Object.entries(seedSettings)) {
        await conn.query('INSERT INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
      }
      await conn.commit();
      console.log('Database settings seeded with defaults.');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── MIGRATION: Fix "The North Dry Fruits" → "North Dry Fruits" ──
  // NOTE: Do NOT force-reset about_story_image here. It runs on every startup and
  // would overwrite any image the admin uploads. The admin can manage it from settings.
  try {
    // Drop the leading "The " from any stored value that uses "The North Dry Fruits"
    await pool.query(
      "UPDATE settings SET value = REPLACE(value, 'The North Dry Fruits', 'North Dry Fruits') WHERE value LIKE '%The North Dry Fruits%'"
    );
  } catch (migrationErr) {
    console.warn('Store name migration note:', migrationErr.message);
  }

  // ── SEED DEFAULT HOMEPAGE SECTIONS ───────────────────────────────

  const [hpCountRows] = await pool.query('SELECT COUNT(*) as count FROM homepage_sections');
  if (hpCountRows[0].count === 0) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Hero Banner Carousel
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['hero_banner', 'Hero Banner', JSON.stringify({
          slides: [
            { badge: 'New Collection 2026', title: 'Premium Quality Products For Your Lifestyle', subtitle: 'Discover our handpicked selection of premium products, sourced from trusted suppliers.', ctaText: 'Shop Now', ctaLink: '/products', image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=800', highlight: 'Curated Premium Selection' },
            { badge: 'Best Sellers', title: 'Top Rated Products Our Customers Love', subtitle: 'Browse our most popular items, rated 5 stars by thousands of happy customers.', ctaText: 'View Best Sellers', ctaLink: '/products', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800', highlight: 'Trusted By Thousands' },
            { badge: 'Limited Edition', title: 'Exclusive Products Available Now', subtitle: 'Get your hands on our exclusive limited-edition products before they sell out.', ctaText: 'Discover More', ctaLink: '/products', image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=800', highlight: 'Premium Quality Guaranteed' }
          ]
        }), 0]
      );

      // 2. Category Showcase
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['category_showcase', 'Browse Categories', JSON.stringify({ heading: 'Browse Categories', description: 'Explore our product categories' }), 1]
      );

      // 3. Featured Products Grid
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['product_grid', 'Featured Products', JSON.stringify({ heading: 'Featured Products', badge: 'Best Seller Collection', filter: 'featured', maxItems: 6 }), 2]
      );

      // 4. New Arrivals Carousel
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['product_carousel', 'New Arrivals', JSON.stringify({ heading: 'New Arrivals', badge: 'Just Landed', description: 'Check out our latest additions to the store.', filter: 'new', maxItems: 8 }), 3]
      );

      // 5. Banner Image
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['banner_image', 'Promotional Banner', JSON.stringify({ image: 'https://images.unsplash.com/photo-1596769062638-e6ed3f46f496?auto=format&fit=crop&q=80&w=1200', link: '/products', alt: 'Shop Our Premium Products' }), 4]
      );

      // 6. Promo Cards
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['promo_cards', 'Promotional Offers', JSON.stringify({
          cards: [
            { badge: 'Save Up to 20% OFF', heading: 'Bundle Deals & Combo Packs', body: 'Get our curated product bundles at special discounted rates this season.', ctaText: 'Shop Deals', ctaLink: '/products', theme: 'dark' },
            { badge: 'Free Express Delivery', heading: 'Fast Shipping Nationwide', body: 'Enjoy free insured doorstep shipping on qualifying orders. Carefully packed and delivered to your home.', ctaText: 'Explore Products', ctaLink: '/products', theme: 'light' }
          ]
        }), 5]
      );

      // 7. Customer Reviews
      await conn.query(
        'INSERT INTO homepage_sections (section_type, title, config, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)',
        ['reviews', 'Customer Reviews', JSON.stringify({
          heading: 'What Our Customers Say',
          reviews: [
            { name: 'Sarah Johnson', rating: 5, text: 'Best quality products I have ever purchased. Truly premium and exactly as described!', location: 'New York' },
            { name: 'Michael Chen', rating: 5, text: 'Amazing products and fast delivery. My whole family loves them. Will order again!', location: 'Los Angeles' },
            { name: 'Emily Davis', rating: 4, text: 'Great selection and fast delivery. Packaging was excellent and everything arrived fresh.', location: 'Chicago' }
          ]
        }), 6]
      );

      await conn.commit();
      console.log('Homepage sections seeded with defaults.');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── SEED DEFAULT PAYMENT ACCOUNTS ────────────────────────────────

  const [paCountRows] = await pool.query('SELECT COUNT(*) as count FROM payment_accounts');
  if (paCountRows[0].count === 0) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        'INSERT INTO payment_accounts (method, title, account_number, account_name, instructions, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        ['easypaisa', 'Mobile Wallet', '1234567890', 'Store Official', 'Send payment to the above number and upload the screenshot as proof.']
      );
      await conn.query(
        'INSERT INTO payment_accounts (method, title, account_number, account_name, instructions, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        ['jazzcash', 'Mobile Payment', '0987654321', 'Store Official', 'Send payment to the above number and upload the transaction screenshot.']
      );
      await conn.query(
        'INSERT INTO payment_accounts (method, title, account_number, account_name, instructions, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        ['bank_transfer', 'Bank Transfer', 'XX00BANK0012345678901234', 'Store Official', 'Transfer the total amount to the above bank account and upload the receipt screenshot.']
      );
      await conn.commit();
      console.log('Default payment accounts seeded.');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = { pool, initDb };
