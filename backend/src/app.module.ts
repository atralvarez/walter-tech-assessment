import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
@Module({
    imports: [
        EventEmitterModule.forRoot(),
        DatabaseModule,
        ProductsModule,
        OrdersModule
    ]
})
export class AppModule {}