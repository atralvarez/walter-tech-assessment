import type { Order } from "../types";

const BASE_URL = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error(error.message ?? "An unexpected error occurred");
	}
	return res.json() as Promise<T>;
}

export const api = {
	orders: {
		list: (): Promise<Order[]> =>
			fetch(`${BASE_URL}/orders`).then((r) => handleResponse<Order[]>(r)),

		get: (orderId: string): Promise<Order> =>
			fetch(`${BASE_URL}/orders/${orderId}`).then((r) =>
				handleResponse<Order>(r),
			),

		advance: (orderId: string): Promise<Order> =>
			fetch(`${BASE_URL}/orders/${orderId}/advance`, { method: "PATCH" }).then(
				(r) => handleResponse<Order>(r),
			),

		fail: (orderId: string): Promise<Order> =>
			fetch(`${BASE_URL}/orders/${orderId}/fail`, { method: "PATCH" }).then(
				(r) => handleResponse<Order>(r),
			),
	},
};
