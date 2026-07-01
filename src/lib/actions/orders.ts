"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types/database";

export type OrderActionResult =
  | { ok: true }
  | { ok: false; error: string };

const VALID_STATUSES = ORDER_STATUSES.map((s) => s.value);

/** Cambia el estado de un pedido. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderActionResult> {
  await requireAdmin();

  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true };
}
