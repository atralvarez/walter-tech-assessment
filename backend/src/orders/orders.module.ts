import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { OrdersController } from "./orders.controller";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";
import { OrdersProcessor } from "./orders.processor";

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
