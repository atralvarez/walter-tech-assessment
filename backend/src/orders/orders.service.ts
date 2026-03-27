import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { type Order } from "../database/schema";
import { ProductsService } from "../products/products.service";
import { OrderFulfillmentService } from "./order-fulfillment.service";
import type { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly fulfillmentService: OrderFulfillmentService,
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
      throw new NotFoundException(
        `Product with SKU '${dto.productSku}' not found`,
      );
    }

    const inserted = this.ordersRepository.insert({
      orderId: dto.orderId,
      productSku: dto.productSku,
      quantity: dto.quantity,
      status: "received",
      autoProcess: dto.autoProcess ?? false,
    });

    return { order: inserted, created: true };
  }

  /**
   * Advances an order to the next state:
   *   received -> processing: just a status update
   *   processing -> delivered: runs the stock-check + deduction transaction (via the fulfillment service)
   */
  advance(orderId: string): Order {
    const order = this.findOne(orderId);
    const nextStatus = this.getNextStatus(order.status);

    if (!nextStatus) {
      throw new BadRequestException(
        `Order '${orderId}' is in terminal state '${order.status}' and cannot be advanced`,
      );
    }

    // If the order is in the processing state, use the fulfillment service to deliver or fail the order properly
    if (order.status === "processing") {
      return this.fulfillmentService.deliver(order);
    }

    return this.ordersRepository.update(orderId, { status: nextStatus });
  }

  /**
   * Marks an order as failed
   */
  fail(orderId: string): Order {
    const order = this.findOne(orderId);
    if (order.status === "delivered" || order.status === "failed") {
      throw new BadRequestException(
        `Order '${orderId}' is in terminal state '${order.status}' and cannot be failed`,
      );
    }
    return this.ordersRepository.update(orderId, { status: "failed", failureReason: "manual" });
  }

  private getNextStatus(current: Order["status"]): Order["status"] | null {
    const transitions: Record<string, Order["status"] | null> = {
      received: "processing",
      processing: "delivered",
      delivered: null,
      failed: null,
    };
    return transitions[current] ?? null;
  }
}
