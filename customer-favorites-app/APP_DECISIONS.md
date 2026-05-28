# APP_DECISIONS.md

## Store Concept

**IronForge** — a premium gym equipment store for serious lifters. The tagline is "Forge Your Best Body." The store sells barbells, dumbbells, machines, accessories, racks & benches, and cardio equipment, organized into a clean category grid on the homepage.

The store was chosen because gym equipment is a high-consideration purchase — customers research extensively, compare products, and return multiple times before buying. A favorites/wishlist feature is a natural and genuinely useful addition for this kind of store.

---

## App Idea

**Customer Favorites** — a wishlist app that lets customers save products from the storefront, and gives merchants a real-time admin dashboard to see what their customers are interested in.

The core merchant insight: knowing which products are being saved (even without purchase) is a strong demand signal. It helps merchants prioritize restocks, run targeted promotions, and understand which products are trending before sales data catches up.

### Why this solves a real problem

Basic Shopify stores have no native wishlist. Customers either buy immediately or lose the product. Merchants get no signal about latent demand. This app fills both gaps — it gives customers a "save for later" flow and gives merchants actionable behavioral data.

---

## Key Architecture Decisions

### 1. MySQL instead of SQLite

The task spec asked for MySQL with multiple related tables. SQLite was used in early development for convenience, but the final implementation uses MySQL 8 via `mysql2/promise` and Drizzle ORM.

The MySQL connection uses `timezone: "+00:00"` explicitly:

```js
const connection = await mysql.createConnection({
  timezone: "+00:00", // store all timestamps as UTC
});
```

This is important because the UI formats dates with `toLocaleString("en-PH")`, which adds +8 hours for Philippine Time. Without the UTC setting, timestamps would be double-offset.

### 2. Four-table schema with full audit trail

```
customers → favorites ← products
               ↓
          activity_log
```

- `customers` and `products` are synced from Shopify on first favorite action (upsert pattern)
- `favorites` is the core junction table — one row per customer+product pair
- `activity_log` records every add and remove action separately, giving merchants a full history even after a favorite is deleted

This means the Activity Log shows the complete behavioral trail (added → removed → added again), while the Dashboard shows only current state.

### 3. Upsert on API POST

When a customer favorites a product, the API doesn't assume the customer or product already exists in the database. It upserts both records (using Shopify IDs as the lookup key) before inserting the favorite. This keeps the schema clean without requiring a separate sync job.

### 4. Server-side pagination in the admin (client-side filtering)

Pagination in the admin dashboard is done client-side using `useMemo` on the already-loaded dataset. This was a deliberate tradeoff: the favorites dataset for a development store is small, and client-side pagination keeps the UI snappy with instant search without extra round trips.

For production at scale, pagination would move server-side (cursor-based, passed as loader params).

### 5. Activity Log as a separate table (not derived)

Activity is stored separately from favorites rather than derived from soft-deletes or timestamps. This means:
- Removes are recorded even though the favorite row is deleted
- The same product can appear multiple times in the log (added, removed, added again)
- Merchants can filter by "Added" or "Removed" independently
- The log is append-only — nothing is ever deleted from it

### 6. Rankings page with real aggregation

The Top Products page runs a `count(*)` + `GROUP BY product_id` query, joined to the products table, ordered descending. This is a real aggregation, not a scan of the favorites table. The result drives:
- A podium display (1st, 2nd, 3rd place)
- A ranked list (#4–#10) with progress bars relative to the #1 product
- Summary stats: total ranked products, total favorites cast, current #1 product name

### 7. Optimistic UI with toast + revalidation

When a merchant removes a favorite from the dashboard:
1. A toast notification fires immediately (optimistic)
2. The `fetcher.submit` sends a DELETE request
3. On `fetcher.state === "idle"`, `revalidator.revalidate()` refetches the loader data

This avoids stale UI without a full page reload, and keeps the live badge meaningful.

### 8. Storefront integration via Liquid + Vanilla JS

The theme uses standard Shopify Liquid sections and a small `favorites.js` asset. The heart button calls the embedded app's `/api/favorites` endpoint directly using the customer's session. No Liquid AJAX API or metafield approach was used — the app owns the data, which makes the admin dashboard and activity log possible.

---

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| Client-side pagination | Fast UX for small datasets; wouldn't scale to 10k+ favorites without server-side cursors |
| Separate activity_log table | More storage; gives full behavioral audit trail |
| Upsert on every POST | Slightly more DB work per request; avoids needing a separate sync job |
| Vanilla JS on storefront | No build step for theme; less interactive than a React widget |
| Hardcoded stat trends (+12% week) | Placeholder — would need time-windowed queries to make real |

---

## What I'd Improve With More Time

**Product**
- Real trend calculations on the stat cards (compare this week vs last week)
- Customer detail page — click a customer to see all their favorites
- Export to CSV for the activity log
- Email/push alerts when a favorited product goes on sale or back in stock
- Merchant-configurable "Favorites limit" per customer

**Technical**
- Move pagination server-side with cursor-based queries for large stores
- Add a job queue to sync product title/image changes back from Shopify webhooks
- MySQL connection pooling (currently uses a single persistent connection)
- Rate limiting on the `/api/favorites` endpoint
- End-to-end tests for the add/remove flow
- Replace the hardcoded `+12% week` trend with a real `COUNT(*) WHERE created_at > NOW() - INTERVAL 7 DAY` comparison

**UX**
- Skeleton loading on the Activity Log and Rankings pages (currently only on Dashboard)
- Bulk remove action for merchants
- Dark mode support in the admin
- Mobile-optimized layout for the favorites grid below 440px