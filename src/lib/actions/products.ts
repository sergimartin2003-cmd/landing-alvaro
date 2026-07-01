"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export interface VariantInput {
  id?: string;
  size: string;
  stock: number;
  sku: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: number;
  images: string[];
  active: boolean;
  variants: VariantInput[];
}

export type ProductActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function validate(input: ProductInput): string | null {
  if (!input.name.trim()) return "El nombre es obligatorio.";
  if (!input.categoryId) return "Selecciona una categoría.";
  if (!(input.basePrice >= 0)) return "El precio no es válido.";
  const sizes = input.variants.map((v) => v.size.trim().toLowerCase());
  if (new Set(sizes).size !== sizes.length) {
    return "Hay tallas repetidas en las variantes.";
  }
  const skus = input.variants
    .map((v) => v.sku.trim().toLowerCase())
    .filter(Boolean);
  if (new Set(skus).size !== skus.length) {
    return "Hay SKUs repetidos en las variantes.";
  }
  for (const v of input.variants) {
    if (!v.size.trim()) return "Cada variante necesita una talla.";
    if (!v.sku.trim()) return "Cada variante necesita un SKU.";
    if (!(v.stock >= 0)) return `Stock inválido en la talla ${v.size}.`;
  }
  return null;
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda", "layout");
  revalidatePath("/producto", "layout");
}

/** Crea un producto con sus variantes. */
export async function createProduct(
  input: ProductInput
): Promise<ProductActionResult> {
  await requireAdmin();
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const slug = (input.slug.trim() || slugify(input.name)).toLowerCase();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description.trim() || null,
      category_id: input.categoryId,
      base_price: input.basePrice,
      images: input.images,
      active: input.active,
    })
    .select("id")
    .single();

  if (error || !product) {
    if (error?.code === "23505") {
      return { ok: false, error: "Ya existe un producto con ese slug." };
    }
    return { ok: false, error: error?.message ?? "No se pudo crear." };
  }

  if (input.variants.length > 0) {
    const { error: vError } = await supabase.from("product_variants").insert(
      input.variants.map((v) => ({
        product_id: product.id,
        size: v.size.trim(),
        stock: v.stock,
        sku: v.sku.trim(),
      }))
    );
    if (vError) {
      // Deshacer el producto para no dejarlo sin variantes por un SKU duplicado.
      await supabase.from("products").delete().eq("id", product.id);
      if (vError.code === "23505") {
        return { ok: false, error: "Algún SKU ya existe en otro producto." };
      }
      return { ok: false, error: vError.message };
    }
  }

  revalidateStorefront();
  return { ok: true, id: product.id };
}

/** Actualiza un producto y reconcilia sus variantes. */
export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ProductActionResult> {
  await requireAdmin();
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const slug = (input.slug.trim() || slugify(input.name)).toLowerCase();

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      slug,
      description: input.description.trim() || null,
      category_id: input.categoryId,
      base_price: input.basePrice,
      images: input.images,
      active: input.active,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un producto con ese slug." };
    }
    return { ok: false, error: error.message };
  }

  // Reconciliar variantes: borrar las eliminadas, upsert del resto.
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  const keepIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
  const toDelete = (existing ?? [])
    .map((v) => v.id)
    .filter((vid) => !keepIds.includes(vid));

  if (toDelete.length > 0) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }

  for (const v of input.variants) {
    if (v.id) {
      const { error: uErr } = await supabase
        .from("product_variants")
        .update({ size: v.size.trim(), stock: v.stock, sku: v.sku.trim() })
        .eq("id", v.id);
      if (uErr) {
        return {
          ok: false,
          error:
            uErr.code === "23505"
              ? `El SKU "${v.sku}" ya existe.`
              : uErr.message,
        };
      }
    } else {
      const { error: iErr } = await supabase.from("product_variants").insert({
        product_id: id,
        size: v.size.trim(),
        stock: v.stock,
        sku: v.sku.trim(),
      });
      if (iErr) {
        return {
          ok: false,
          error:
            iErr.code === "23505"
              ? `El SKU "${v.sku}" ya existe.`
              : iErr.message,
        };
      }
    }
  }

  revalidateStorefront();
  return { ok: true, id };
}

/** Activa/desactiva un producto (ocultarlo de la tienda sin borrarlo). */
export async function toggleProductActive(
  id: string,
  active: boolean
): Promise<ProductActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateStorefront();
  return { ok: true, id };
}

/**
 * Elimina un producto. Si tiene pedidos asociados, hace soft delete
 * (active = false) para preservar el histórico; si no, lo borra de verdad.
 */
export async function deleteProduct(
  id: string
): Promise<ProductActionResult & { softDeleted?: boolean }> {
  await requireAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateStorefront();
    return { ok: true, id, softDeleted: true };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateStorefront();
  return { ok: true, id, softDeleted: false };
}
