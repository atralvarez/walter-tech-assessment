import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { OrdersController } from "./orders.controller";
import { OrdersProcessor } from "./orders.processor";
import { OrdersRepository } from "./orders.repository";
import { OrderFulfillmentService } from "./order-fulfillment.service";
import { OrdersService } from "./orders.service";

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, OrderFulfillmentService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
