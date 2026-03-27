import { AlertCircle, ChevronRight, RefreshCw, XCircle } from "lucide-react";
import { useOrderActions } from "../hooks/use-order-actions";
import { useOrders } from "../hooks/use-orders";
import { StatusBadge } from "./status-badge";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersTable() {
  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useOrders();
  const { advance, fail } = useOrderActions();

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">
            {orders ? `${orders.length} total orders` : "Loading..."}
            <span className="ml-2 text-xs text-gray-400">
              • Auto-refreshes every 5s
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className=" cursor-pointer inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading orders...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-600">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">Failed to load orders</p>
          <p className="text-xs text-red-400">{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && orders?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-sm">No orders yet.</p>
          <p className="mt-1 text-xs">
            Send a POST to /api/orders to create one.
          </p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Order ID
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Product (SKU)
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Qty
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Created
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-gray-50/70"
                >
                  <td className="px-4 py-3 sm:px-6">
                    <span className="font-mono text-xs font-medium text-gray-900">
                      {order.orderId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">
                    {order.productSku}
                  </td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">{order.quantity}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 sm:px-6">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    {order.status !== "delivered" && order.status !== "failed" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => advance.mutate(order.orderId)}
                          disabled={
                            (advance.isPending && advance.variables === order.orderId) ||
                            (fail.isPending && fail.variables === order.orderId)
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronRight className="h-3 w-3" />
                          Advance
                        </button>
                        <button
                          type="button"
                          onClick={() => fail.mutate(order.orderId)}
                          disabled={
                            (advance.isPending && advance.variables === order.orderId) ||
                            (fail.isPending && fail.variables === order.orderId)
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Fail
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
