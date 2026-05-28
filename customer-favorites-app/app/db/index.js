import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.server.js";

const connection = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: undefined,
  database: "ironforge_db",
  timezone: "+00:00", // FIX: tell mysql2 to treat timestamps as UTC
                      // so toLocaleString("en-PH") correctly adds +8 hours
});

export const db = drizzle(connection, { schema, mode: "default" });