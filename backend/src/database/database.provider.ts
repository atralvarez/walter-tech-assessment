import { Logger } from "@nestjs/common";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

export const DATABASE_TOKEN = "DATABASE";

export const databaseProvider = {
	provide: DATABASE_TOKEN,
	useFactory: () => {
		const logger = new Logger("DatabaseProvider");
		const dbPath =
			process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "db/sqlite.db");

		logger.log(`Connecting to SQLite database at: ${dbPath}`);

		const sqlite = new Database(dbPath);
		sqlite.pragma("journal_mode = WAL");
		sqlite.pragma("synchronous = normal");
		sqlite.pragma("foreign_keys = ON");

		const db = drizzle(sqlite, { schema });
		logger.log("Database connection established");
		return db;
	},
};

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
