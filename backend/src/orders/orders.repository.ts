import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DATABASE_TOKEN, type DrizzleDB } from "../database/database.provider";
import { type NewOrder, orders } from "../database/schema";

@Injectable()
export class OrdersRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DrizzleDB) {}

  findAll() {
    return this.db.select().from(orders).orderBy(sql`${orders.createdAt} DESC`).all();
  }

  findByOrderId(orderId: string) {
    return this.db.select().from(orders).where(eq(orders.orderId, orderId)).get();
  }

  insert(values: NewOrder) {
    const [inserted] = this.db.insert(orders).values(values).returning().all();
    return inserted;
  }
}
