import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { DatabaseModule } from "./database/database.module";
import { OrdersModule } from "./orders/orders.module";
import { ProductsModule } from "./products/products.module";
@Module({
	imports: [
		EventEmitterModule.forRoot(),
		DatabaseModule,
		ProductsModule,
		OrdersModule,
	],
})
export class AppModule {}
