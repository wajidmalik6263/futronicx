# Store Backend API Documentation

This directory contains the Express backend for the Store, using a MySQL database connection pool (`mysql2/promise`).

In production, this server also serves the built React frontend from `../client/dist` as a single-process deployment.

## Setup and Run

```bash
# 1. Install dependencies
npm install

# 2. Create the MySQL database (if it doesn't exist yet)
#    Using your MySQL client, phpMyAdmin, or terminal:
#    CREATE DATABASE IF NOT EXISTS gbmarket CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# 3. Configure environment variables
#    Copy .env.example to .env and fill in your MySQL credentials
cp .env.example .env

# 4. Reseed the database (Optional — resets data to initial sample dataset)
npm run seed

# 5. Start development server (with auto-restart via nodemon)
npm run dev

# Or start production server
npm start
```

## MySQL Configuration

The server connects to MySQL using the following environment variables (set in `.env`):

| Variable      | Description         | Default     |
|---------------|---------------------|-------------|
| `DB_HOST`     | MySQL host          | `localhost` |
| `DB_PORT`     | MySQL port          | `3306`      |
| `DB_USER`     | MySQL username      | `root`      |
| `DB_PASSWORD` | MySQL password      | (empty)     |
| `DB_NAME`     | Database name       | `gbmarket`  |

For **Hostinger Business Web Hosting**, these values are auto-provided when you create a MySQL database and link it to your Node.js app via the hosting panel.

## Single-Service Deployment

In production, the server serves the built React frontend alongside the API:
- Static files from `../client/dist` are served first
- API routes (`/api/*`) take priority over the SPA catch-all
- Any unmatched GET request returns `index.html` for React Router client-side routing
- CORS automatically allows same-origin requests from the server's own origin

Build the frontend before starting:
```bash
cd ../client && npm run build
cd ../server && npm start
```

Or from the repo root: `npm run build && npm start`

## Available Endpoints (Port 5000)

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```
*Returns:* `{ "status": "<store_name> API is running", "database": "connected" }`

---

### 2. Categories
#### Get All Categories
```bash
curl http://localhost:5000/api/categories
```
*Returns:* Array of all categories with `id`, `name`, `slug`, and `productCount`.

#### Create Category (Admin)
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <jwt-token>" \
  -d '{"name":"Dried Beans", "slug":"dried-beans"}' http://localhost:5000/api/categories
```

#### Delete Category (Admin)
```bash
curl -X DELETE -H "Authorization: Bearer <jwt-token>" http://localhost:5000/api/categories/11
```

---

### 3. Products

#### Get All Products (with pagination)
```bash
curl "http://localhost:5000/api/products?page=1&limit=10"
```
*Returns:* `{ products: [...], pagination: { total, page, limit, totalPages } }`

#### Filter by Category / Search
```bash
curl "http://localhost:5000/api/products?category=almonds"
curl "http://localhost:5000/api/products?search=almond"
```

#### Get Product by Slug
```bash
curl http://localhost:5000/api/products/premium-paper-shell-almonds
```

#### Create a Product (Admin)
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <jwt-token>" -d '{
  "name": "Sample Product",
  "slug": "sample-product",
  "description": "Test item",
  "category_id": 1,
  "base_price": 500,
  "weight_options": [{"label":"1kg","price":500}]
}' http://localhost:5000/api/products
```

#### Update / Delete a Product (Admin)
```bash
curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <jwt-token>" \
  -d '{"name":"Updated","slug":"sample","base_price":600}' http://localhost:5000/api/products/1
curl -X DELETE -H "Authorization: Bearer <jwt-token>" http://localhost:5000/api/products/1
```

---

### 4. Orders

#### Create an Order (Public)
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "customer_name": "John Doe",
  "phone": "1234567890",
  "address": "123 Test St, City",
  "payment_method": "COD",
  "items": [
    { "product_id": 1, "weight_option": "1kg", "quantity": 1 }
  ]
}' http://localhost:5000/api/orders
```
*Note: Server-side price lookup and atomic stock decrement. Shipping fee calculated based on settings.*

#### Get All Orders (Admin)
```bash
curl -H "Authorization: Bearer <jwt-token>" http://localhost:5000/api/orders
```

#### Update Order Status (Admin)
```bash
curl -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer <jwt-token>" \
  -d '{"status":"Shipped"}' http://localhost:5000/api/orders/1/status
```
*Valid statuses:* `Pending` → `Processing` → `Shipped` → `Delivered`. Also `Cancelled` (restores stock).

#### Track Order (Public)
```bash
curl "http://localhost:5000/api/orders/track?order_id=1&phone=1234567890"
```

---

### 5. Settings

#### Get All Settings (Public)
```bash
curl http://localhost:5000/api/settings
```
*Returns:* Flat key-value JSON object with all site settings.

#### Update Settings (Admin)
```bash
curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <jwt-token>" \
  -d '{"store_name":"Updated Store","currency_symbol":"$"}' http://localhost:5000/api/settings
```

---

### 6. File Uploads

#### Upload Images (Admin)
```bash
curl -X POST -H "Authorization: Bearer <jwt-token>" -F "image=@/path/to/image.jpg" \
  http://localhost:5000/api/upload
```
*Returns:* `{ "url": "..." }` — Cloudinary URL when configured, local `/uploads/` path as fallback.

#### Upload Payment Receipts (Public)
```bash
curl -X POST -F "image=@/path/to/receipt.jpg" http://localhost:5000/api/payments/receipt-upload
```

---

### 7. Additional Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/homepage` | GET | Public | Visible homepage sections |
| `/api/homepage/admin` | GET | Admin | All homepage sections |
| `/api/homepage` | POST | Admin | Create section |
| `/api/homepage/reorder` | PUT | Admin | Reorder sections |
| `/api/payments/methods` | GET | Public | Available payment methods |
| `/api/payments/accounts` | GET | Public | Active payment accounts |
| `/api/reviews?product_id=X` | GET | Public | Approved reviews for a product |
| `/api/reviews` | POST | Public | Submit a review (pending approval) |
| `/api/chatbot/message` | POST | Public | AI shopping assistant |
| `/api/contact` | POST | Public | Contact form submission |
| `/api/auth/login` | POST | Public | Admin login (rate-limited) |
| `/api/auth/me` | GET | Admin | Current admin info |
| `/sitemap.xml` | GET | Public | Dynamic XML sitemap |
| `/robots.txt` | GET | Public | Dynamic robots.txt |
