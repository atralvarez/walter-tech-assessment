export type OrderStatus = "received" | "processing" | "delivered" | "failed";

export interface Order {
  id: number;
  orderId: string;
  productSku: string;
  quantity: number;
  status: OrderStatus;
  autoProcess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  stock: number;
  price: number;
  status: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
