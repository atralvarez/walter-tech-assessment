import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(":orderId")
  findOne(@Param("orderId") orderId: string) {
    return this.ordersService.findOne(orderId);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Res() res: Response) {
    const { order, created } = this.ordersService.create(dto);

    if (created) {
      this.eventEmitter.emit("order.received", { orderId: order.orderId });
    }

    return res.status(created ? 201 : 200).json(order);
  }
}
