-- Run this SQL to update all references to 'North Dry Fruits' in the database
-- Execute via phpMyAdmin, MySQL CLI, or your hosting panel

-- 1. Update store name
UPDATE settings SET value = 'North Dry Fruits' WHERE `key` = 'store_name';

-- 2. Update store tagline
UPDATE settings SET value = 'Premium organic dry fruits & nuts from Gilgit-Baltistan' WHERE `key` = 'store_tagline';

-- 3. Update About page content
UPDATE settings SET value = 'Welcome to North Dry Fruits' WHERE `key` = 'about_hero_heading';

UPDATE settings SET value = 'Bringing 100% authentic, sun-dried organic dry fruits and nuts directly from the mountain farmers of Gilgit-Baltistan to your doorstep across Pakistan.' WHERE `key` = 'about_hero_subheading';

UPDATE settings SET value = 'Sourced From High Altitude Orchards of Gilgit-Baltistan' WHERE `key` = 'about_story_heading';

UPDATE settings SET value = 'North Dry Fruits was founded with a simple mission — to bring the purest, most nutritious dry fruits from the valleys of Gilgit-Baltistan directly to families across Pakistan.\n\nOur products are hand-picked from high-altitude orchards where the clean mountain air and natural sunlight produce the richest flavors. We work directly with local farmers, cutting out middlemen to ensure freshness, fair pricing, and authenticity in every pack.' WHERE `key` = 'about_story_text';

-- 4. Update About page images (fix broken images)
UPDATE settings SET value = 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800' WHERE `key` = 'about_story_image';

-- 5. Update bullet points
UPDATE settings SET value = '100% Authentic & Naturally Sun-Dried' WHERE `key` = 'about_bullet_1';
UPDATE settings SET value = 'Direct From Farmers — No Middlemen' WHERE `key` = 'about_bullet_2';

-- 6. Update gallery images (if they exist in settings)
INSERT INTO settings (`key`, value) VALUES ('about_gallery_image_1', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600')
ON DUPLICATE KEY UPDATE value = 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600';

INSERT INTO settings (`key`, value) VALUES ('about_gallery_image_2', 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&q=80&w=600')
ON DUPLICATE KEY UPDATE value = 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&q=80&w=600';

INSERT INTO settings (`key`, value) VALUES ('about_gallery_image_3', 'https://images.unsplash.com/photo-1563292769-4e05b684851a?auto=format&fit=crop&q=80&w=600')
ON DUPLICATE KEY UPDATE value = 'https://images.unsplash.com/photo-1563292769-4e05b684851a?auto=format&fit=crop&q=80&w=600';

-- 7. Update footer text
UPDATE settings SET value = 'Your trusted source for 100% authentic, sun-dried organic dry fruits and nuts, sourced directly from the mountain farmers of Gilgit-Baltistan and delivered to your doorstep.' WHERE `key` = 'footer_about_text';

-- 8. Catch-all: Drop the leading "The " from any remaining references
UPDATE settings SET value = REPLACE(value, 'The North Dry Fruits', 'North Dry Fruits')
WHERE value LIKE '%The North Dry Fruits%';
