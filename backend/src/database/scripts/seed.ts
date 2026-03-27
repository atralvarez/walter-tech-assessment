import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { type Product, products } from "../schema";

const dbPath =
	process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../../db/sqlite.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function seed() {
	console.log("Seeding products...");

	const seedProducts: Array<Omit<Product, "id">> = [
		{
			sku: "TSHIRT-WHT-S",
			name: "Camiseta blanca S",
			stock: 42,
			price: 1299,
			status: "active",
		},
		{
			sku: "TSHIRT-WHT-M",
			name: "Camiseta blanca M",
			stock: 38,
			price: 1299,
			status: "active",
		},
		{
			sku: "TSHIRT-WHT-L",
			name: "Camiseta blanca L",
			stock: 25,
			price: 1299,
			status: "active",
		},
		{
			sku: "TSHIRT-BLK-S",
			name: "Camiseta negra S",
			stock: 50,
			price: 1399,
			status: "active",
		},
		{
			sku: "TSHIRT-BLK-M",
			name: "Camiseta negra M",
			stock: 47,
			price: 1399,
			status: "active",
		},
		{
			sku: "TSHIRT-BLK-L",
			name: "Camiseta negra L",
			stock: 30,
			price: 1399,
			status: "active",
		},
		{
			sku: "HOODIE-GRY-M",
			name: "Sudadera gris M",
			stock: 18,
			price: 3499,
			status: "active",
		},
		{
			sku: "HOODIE-GRY-L",
			name: "Sudadera gris L",
			stock: 12,
			price: 3499,
			status: "active",
		},
		{
			sku: "HOODIE-NVY-M",
			name: "Sudadera azul marino M",
			stock: 9,
			price: 3699,
			status: "active",
		},
		{
			sku: "HOODIE-NVY-L",
			name: "Sudadera azul marino L",
			stock: 7,
			price: 3699,
			status: "active",
		},
		{
			sku: "CAP-BLK",
			name: "Gorra negra",
			stock: 60,
			price: 1999,
			status: "active",
		},
		{
			sku: "CAP-WHT",
			name: "Gorra blanca",
			stock: 55,
			price: 1999,
			status: "active",
		},
		{
			sku: "SOCKS-WHT-M",
			name: "Calcetines blancos M (pack 3)",
			stock: 80,
			price: 899,
			status: "active",
		},
		{
			sku: "SOCKS-BLK-M",
			name: "Calcetines negros M (pack 3)",
			stock: 75,
			price: 899,
			status: "active",
		},
		{
			sku: "BELT-BRN-M",
			name: "Cinturón marrón M",
			stock: 22,
			price: 2499,
			status: "active",
		},
		{
			sku: "BELT-BLK-M",
			name: "Cinturón negro M",
			stock: 20,
			price: 2499,
			status: "active",
		},
		{
			sku: "SCARF-GRY",
			name: "Bufanda gris",
			stock: 14,
			price: 2999,
			status: "active",
		},
		{
			sku: "GLOVES-BLK-M",
			name: "Guantes negros M",
			stock: 11,
			price: 2299,
			status: "active",
		},
		{
			sku: "JACKET-BLK-M",
			name: "Chaqueta negra M",
			stock: 6,
			price: 8999,
			status: "active",
		},
		{
			sku: "JACKET-BLK-L",
			name: "Chaqueta negra L",
			stock: 4,
			price: 8999,
			status: "archived",
		},
	];

	for (const product of seedProducts) {
		await db
			.insert(products)
			.values(product)
			.onConflictDoUpdate({
				target: products.sku,
				set: { name: product.name, stock: product.stock, price: product.price },
			});
	}

	console.log(`Seeded ${seedProducts.length} products.`);
	sqlite.close();
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
