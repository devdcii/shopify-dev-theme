# Customer Favorites App

A Shopify embedded app that lets customers save favorite products and gives merchants a real-time admin dashboard to track, manage, and analyze customer wishlist behavior.

> **Store concept:** IronForge — a premium gym equipment store for serious lifters. Built to last, designed to perform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Router v7 + Vite + Shopify Polaris |
| Backend | Node.js (Remix/React Router server) |
| Database | MySQL via Drizzle ORM |
| Auth | Shopify OAuth (embedded app flow) |
| Storefront | Shopify Liquid + CSS + Vanilla JS |

---

## Features

### Storefront (Customer-Facing)
- ❤️ **Add/remove favorite products** — heart button on every product card and product page
- 📄 **"Your Favorites" page** — dedicated storefront page showing all saved products with timestamps
- 🎨 **Custom Liquid sections** — Customer Favorites hero section + product grid with live save dates
- 🔘 **Persistent favorites** — saved per customer account, synced across sessions

### Admin Dashboard (Merchant-Facing)
- 📊 **Stats overview** — Total Favorites, Active Customers, Unique Products with live badge
- 🗂️ **Favorites grid** — paginated product cards with customer info, timestamps, product IDs
- 🔍 **Search & filter** — search by product title, customer name, or ID
- 📑 **Configurable pagination** — 8 / 12 / 20 / 32 per page
- 🗑️ **Remove favorites** — merchants can remove any favorite with toast confirmation
- 📋 **Activity Log** — full history of all added/removed actions with customer + product info
- 🏆 **Top Products** — ranked leaderboard of most-favorited products with podium display and progress bars
- ⚡ **Live auto-refresh** — revalidates data after mutations via React Router's `useRevalidator`

---

## Project Structure

```
shopify-favorites-app/
├── customer-favorites-app/          # Embedded Shopify App
│   ├── app/
│   │   ├── db/
│   │   │   ├── index.js             # MySQL connection (Drizzle)
│   │   │   ├── schema.server.js     # Table definitions
│   │   │   └── migrations/          # Drizzle-generated SQL
│   │   ├── routes/
│   │   │   ├── _index.jsx           # Dashboard (favorites grid)
│   │   │   ├── activity.jsx         # Activity log page
│   │   │   ├── rankings.jsx         # Top products page
│   │   │   └── api.favorites.jsx    # REST API (GET/POST/DELETE)
│   │   └── shopify.server.js        # Shopify auth + session
│   ├── drizzle.config.js
│   └── package.json
│
└── shopify-favorites-theme/         # Shopify Storefront Theme
    ├── sections/
    │   ├── hero-banner.liquid
    │   ├── category-grid.liquid
    │   ├── customer-favorites.liquid
    │   └── featured-products.liquid
    ├── snippets/
    │   ├── favorites-button.liquid
    │   └── product-card.liquid
    ├── assets/
    │   └── favorites.js             # Add/remove toggle + API calls
    └── templates/
        └── page.favorites.liquid    # Customer favorites page
```

---

## Database Schema

```sql
-- Customers synced from Shopify
customers (id, shopify_customer_id, name, email, created_at)

-- Products synced from Shopify  
products (id, shopify_product_id, title, image_url, price, created_at)

-- Core favorites junction table
favorites (id, customer_id → customers, product_id → products, created_at)

-- Full audit trail of add/remove actions
activity_log (id, customer_id → customers, product_id → products, action ENUM('added','removed'), created_at)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites?customerId=X` | Get favorites for a customer |
| POST | `/api/favorites` | Add a favorite (upsert customer + product) |
| DELETE | `/api/favorites` | Remove a favorite + log activity |

---

## Setup Instructions

### Prerequisites

- Node.js v20+
- Shopify CLI v4+
- Shopify Partner Account + Development Store
- MySQL 8.0+ running locally (or remote)

### 1. Install dependencies

```bash
cd customer-favorites-app
npm install
```

### 2. Configure database

Create a MySQL database:

```sql
CREATE DATABASE ironforge_db;
```

Update `app/db/index.js` with your credentials:

```js
const connection = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "your_password",   // set your password here
  database: "ironforge_db",
  timezone: "+00:00",          // treats timestamps as UTC; en-PH locale adds +8h
});
```

### 3. Run migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4. Start the dev server

```bash
shopify app dev
```

Press `p` to open the app preview in Shopify Admin.

### 5. Theme setup

```bash
cd shopify-favorites-theme
shopify theme push --store YOUR-STORE.myshopify.com
```

Then in the Shopify Theme Editor:
1. Add the **Customer Favorites** section to your home page
2. Add the **Favorites Button** snippet to your product template
3. Set the **App API URL** to your Cloudflare tunnel URL (shown by `shopify app dev`)

---

## Environment Notes

- **Timezone**: MySQL connection uses `timezone: "+00:00"` so all timestamps are stored as UTC. The UI formats them with `toLocaleString("en-PH")` which correctly displays Philippine Time (UTC+8).
- **Sessions**: Managed by Shopify's session storage adapter (SQLite in dev, can be swapped for MySQL in prod).
- **Tunnel**: Shopify CLI automatically provisions a Cloudflare tunnel for webhook + OAuth callbacks.

---

## Screenshots

| View | Description |
|---|---|
| Storefront Home | IronForge hero, category grid (Barbells, Dumbbells, Machines, etc.) |
| Your Favorites | Customer-facing saved products page with timestamps |
| Admin Dashboard | Stats cards + paginated favorites grid with search |
| Activity Log | Full audit log with Added/Removed filter tabs |
| Top Products | Podium (#1/#2/#3) + ranked list with favorites count + progress bars |

---

*Customer Favorites App · Built with Shopify + React + Drizzle ORM*