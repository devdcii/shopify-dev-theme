import { mysqlTable, int, varchar, timestamp, text } from "drizzle-orm/mysql-core";

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  shopifyCustomerId: varchar("shopify_customer_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  handle: varchar("handle", { length: 255 }),
  imageUrl: text("image_url"),
  price: varchar("price", { length: 50 }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const favorites = mysqlTable("favorites", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  productId: int("product_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const activityLog = mysqlTable("activity_log", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  productId: int("product_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});