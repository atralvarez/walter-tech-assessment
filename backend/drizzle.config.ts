import type { Config } from "drizzle-kit";
import path from "node:path";

const dbPath =
  process.env.DATABASE_PATH ?? path.resolve(__dirname, "db/sqlite.db");

export default {
  schema: "./src/database/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
