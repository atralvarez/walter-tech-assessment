import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DATABASE_TOKEN, type DrizzleDB } from "../database/database.provider";
import { products } from "../database/schema";

@Injectable()
export class ProductsRepository {
	constructor(@Inject(DATABASE_TOKEN) private readonly db: DrizzleDB) {}

	findAll() {
		return this.db.select().from(products).all();
	}

	findBySku(sku: string) {
		return this.db.select().from(products).where(eq(products.sku, sku)).get();
	}
}
