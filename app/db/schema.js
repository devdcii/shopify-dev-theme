import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id").notNull(),
  productId: text("product_id").notNull(),
  productTitle: text("product_title"),
  productImage: text("product_image"),
  productHandle: text("product_handle"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});