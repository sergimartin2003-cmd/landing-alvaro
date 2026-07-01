import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  OrderWithItems,
  ProductWithVariants,
} from "@/lib/types/database";

const PRODUCT_SELECT =
  "*, category:categories(name, slug), variants:product_variants(*)";

/** Todos los productos (incluidos inactivos) para el panel de admin. */
export async function getAdminProducts(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ProductWithVariants[]) ?? [];
}

/** Un producto por id (con variantes) para editar. */
export async function getAdminProduct(
  id: string
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ProductWithVariants | null;
}

/** Lista de pedidos (para la Terminal de Ventas). */
export async function getAdminOrders(): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as OrderWithItems[]) ?? [];
}

/** Un pedido por id (con líneas). */
export async function getAdminOrder(
  id: string
): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as OrderWithItems | null;
}
