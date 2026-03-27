import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { OrdersService } from "./orders.service";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent("order.received", { async: true })
  async handleOrderReceived(payload: { orderId: string }) {
    const { orderId } = payload;
    this.logger.log(`[order.received] Advancing order '${orderId}' to processing`);

    await sleep(500);

    try {
      this.ordersService.advance(orderId);
      this.eventEmitter.emit("order.processing", { orderId });
    } catch (err) {
      this.logger.error(`Failed to advance order '${orderId}': ${err}`);
    }
  }

  @OnEvent("order.processing", { async: true })
  async handleOrderProcessing(payload: { orderId: string }) {
    const { orderId } = payload;
    this.logger.log(`[order.processing] Completing order '${orderId}'`);

    await sleep(300);

    try {
      this.ordersService.advance(orderId);
    } catch (err) {
      this.logger.error(`Failed to complete order '${orderId}': ${err}`);
    }
  }
}
