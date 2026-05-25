import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.js",
  out: "./app/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./favorites.db",
  },
});