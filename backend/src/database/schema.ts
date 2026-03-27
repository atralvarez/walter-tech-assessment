import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	sku: text("sku").notNull().unique(),
	name: text("name").notNull(),
	stock: integer("stock").notNull().default(0),
	price: integer("price").notNull().default(0),
	status: text("status", { enum: ["active", "archived"] })
		.notNull()
		.default("active"),
});

export const orders = sqliteTable("orders", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	orderId: text("order_id").unique().notNull(),
	productSku: text("product_sku").notNull(),
	quantity: integer("quantity").notNull(),
	status: text("status", {
		enum: ["received", "processing", "delivered", "failed"],
	})
		.notNull()
		.default("received"),
	autoProcess: integer("auto_process", { mode: "boolean" }).notNull().default(false),
	createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = Order["status"];
