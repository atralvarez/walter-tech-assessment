import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const ORDERS_KEY = ["orders"] as const;

export function useOrders() {
	return useQuery({
		queryKey: ORDERS_KEY,
		queryFn: api.orders.list,
		refetchInterval: 5000,
		staleTime: 2000,
	});
}
