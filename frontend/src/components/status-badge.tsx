import { cn } from "../lib/utils";
import type { FailureReason, OrderStatus } from "../types";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  received: {
    label: "Received",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  processing: {
    label: "Processing",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  delivered: {
    label: "Delivered",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

interface StatusBadgeProps {
  status: OrderStatus;
  failureReason?: FailureReason | null;
}

export function StatusBadge({ status, failureReason }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (status === "failed" && failureReason) {
    return (
      <span className="inline-flex overflow-hidden rounded-full border border-rose-200 text-xs font-medium">
        <span className="bg-rose-50 px-2.5 py-0.5 text-rose-700">{config.label}</span>
        <span className="border-l border-rose-200 bg-gray-50 px-2 py-0.5 text-gray-500">
          {failureReason === "system" ? "System" : "Manual"}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
