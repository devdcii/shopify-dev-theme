# Customer Favorites App

A Shopify embedded app with a customer favorites feature built with Vite, Node.js, and Drizzle ORM.

## Tech Stack

- **Frontend**: React Router + Vite + Shopify Polaris
- **Backend**: Node.js
- **Database**: SQLite via Drizzle ORM
- **Auth**: Shopify OAuth
- **Theme**: Shopify Liquid + CSS

## Features

- ❤️ Add/remove favorite products
- 📋 Admin interface to view all favorites
- 🎨 Customer Favorites section on storefront
- 🔘 Add to Favorites button on product page
- 🗄️ Favorites stored in SQLite database

## Setup Instructions

### Prerequisites
- Node.js v20+
- Shopify CLI v4+
- Shopify Partner Account
- Shopify Development Store

### Installation

1. Clone the repository
2. Install dependencies:
```bash
   cd customer-favorites-app
   npm install
```

3. Run database migration:
```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
```

4. Start the development server:
```bash
   shopify app dev
```

5. Press `p` to open app preview in Shopify Admin

### Theme Setup

1. Go to theme folder:
```bash
   cd shopify-favorites-theme
```

2. Push theme to store:
```bash
   shopify theme push --store YOUR-STORE.myshopify.com
```

3. Go to Theme Editor → Add "Customer Favorites" section
4. Set App API URL to your tunnel URL

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/favorites | Get all favorites |
| POST | /api/favorites | Add a favorite |
| DELETE | /api/favorites | Remove a favorite |

## Project Structure

shopify-favorites-app/
├── customer-favorites-app/     # Embedded app
│   ├── app/
│   │   ├── db/                 # Drizzle schema & migrations
│   │   ├── routes/             # API & UI routes
│   │   └── shopify.server.js   # Shopify auth
│   ├── drizzle.config.js
│   └── package.json
└── shopify-favorites-theme/    # Shopify theme
├── sections/
│   └── customer-favorites.liquid
└── snippets/
└── favorites-button.liquid

## Notes

- Static customer ID used: `customer_001`
- Database: SQLite (favorites.db)
- Session storage: SQLite (sessions.sqlite)