import { Injectable, NotFoundException } from "@nestjs/common";
import { type Order } from "../database/schema";
import { ProductsService } from "../products/products.service";
import type { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsService: ProductsService,
  ) {}

  findAll(): Order[] {
    return this.ordersRepository.findAll();
  }

  findOne(orderId: string): Order {
    const order = this.ordersRepository.findByOrderId(orderId);
    if (!order) throw new NotFoundException(`Order '${orderId}' not found`);
    return order;
  }

  /**
   * Creates an order. Idempotent: if orderId already exists, returns the
   * existing order without modification (HTTP 200) rather than erroring.
   */
  create(dto: CreateOrderDto): { order: Order; created: boolean } {
    const existing = this.ordersRepository.findByOrderId(dto.orderId);
    if (existing) {
      return { order: existing, created: false };
    }

    const product = this.productsService.findBySku(dto.productSku);
    if (!product) {
      throw new NotFoundException(`Product with SKU '${dto.productSku}' not found`);
    }

    const inserted = this.ordersRepository.insert({
      orderId: dto.orderId,
      productSku: dto.productSku,
      quantity: dto.quantity,
      status: "received",
    });

    return { order: inserted, created: true };
  }
}