import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, sql } from "drizzle-orm";
import { DATABASE_TOKEN, type DrizzleDB } from "../database/database.provider";
import { type Order, orders, products } from "../database/schema";
import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrderFulfillmentService {
	constructor(
		@Inject(DATABASE_TOKEN) private readonly db: DrizzleDB,
		@Inject(OrdersRepository)
		private readonly ordersRepository: OrdersRepository,
	) {}

	deliver(order: Order): Order {
		try {
			return this.db.transaction((tx) => {
				// 1. Read stock
				const product = tx
					.select()
					.from(products)
					.where(eq(products.sku, order.productSku))
					.get();

				if (!product || product.stock < order.quantity) {
					throw new Error("INSUFFICIENT_STOCK");
				}

				// 2. Deduct stock
				const result = tx
					.update(products)
					.set({ stock: sql`${products.stock} - ${order.quantity}` })
					.where(
						and(
							eq(products.sku, order.productSku),
							gte(products.stock, order.quantity),
						),
					)
					.run();

				if (result.changes === 0) {
					throw new Error("INSUFFICIENT_STOCK");
				}

				// 3. Mark order as delivered
				return tx
					.update(orders)
					.set({ status: "delivered", updatedAt: sql`(CURRENT_TIMESTAMP)` })
					.where(eq(orders.orderId, order.orderId))
					.returning()
					.get();
			});
		} catch {
			// Transaction rolled back, mark order as failed
			return this.ordersRepository.update(order.orderId, {
				status: "failed",
				failureReason: "system",
			});
		}
	}
}
