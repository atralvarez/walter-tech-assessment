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

    const order = this.ordersService.findOne(orderId);
    if (!order.autoProcess) {
      this.logger.log(`[order.received] Order '${orderId}' is manual-only, skipping auto-advance`);
      return;
    }

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

    const order = this.ordersService.findOne(orderId);
    if (!order.autoProcess) {
      this.logger.log(`[order.processing] Order '${orderId}' is manual-only, skipping auto-advance`);
      return;
    }

    this.logger.log(`[order.processing] Completing order '${orderId}'`);
    await sleep(300);

    try {
      const updated = this.ordersService.advance(orderId);
      if (updated.status === "delivered") {
        this.logger.log(`Order '${orderId}' delivered successfully`);
      } else {
        this.logger.warn(`Order '${orderId}' could not be delivered, status: ${updated.status}`);
      }
    } catch (err) {
      this.logger.error(`Unexpected error completing order '${orderId}': ${err}`);
    }
  }
}
