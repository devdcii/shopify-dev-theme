import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./app/db/schema.server.js",
  out: "./app/db/migrations",
  dbCredentials: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: undefined,
    database: "ironforge_db",
  },
});