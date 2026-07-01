import { ORDER_STATUS_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}
