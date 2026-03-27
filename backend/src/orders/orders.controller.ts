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

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
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

    return res.status(created ? 201 : 200).json(order);
  }
}
