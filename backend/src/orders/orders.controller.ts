import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Res,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Response } from "express";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
	constructor(
		@Inject(OrdersService) private readonly ordersService: OrdersService,
		@Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
	) {}

	@Get()
	findAll() {
		return this.ordersService.findAll();
	}

	@Get(":orderId")
	findOne(@Param("orderId") orderId: string) {
		return this.ordersService.findOne(orderId);
	}

	@Patch(":orderId/advance")
	advance(@Param("orderId") orderId: string) {
		return this.ordersService.advance(orderId);
	}

	@Patch(":orderId/fail")
	fail(@Param("orderId") orderId: string) {
		return this.ordersService.fail(orderId);
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
