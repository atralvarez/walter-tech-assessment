import { IsInt, IsString, Min } from "class-validator";

export class CreateOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  productSku: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
