import { Injectable } from "@nestjs/common";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  findAll() {
    return this.productsRepository.findAll();
  }

  findBySku(sku: string) {
    return this.productsRepository.findBySku(sku);
  }
}
