import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  productSku: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsBoolean()
  @IsOptional()
  autoProcess?: boolean;
}
