import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ProductWithVariants,
} from "@/lib/types/database";

// El SELECT anidado que trae producto + categoría + variantes.
const PRODUCT_SELECT =
  "*, category:categories(name, slug), variants:product_variants(*)";

export interface CatalogFilters {
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "novedad" | "precio-asc" | "precio-desc";
}

/** Todas las categorías, ordenadas para el menú. */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/** Una categoría por slug (o null si no existe). */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

/** Productos destacados para la home (activos, más recientes). */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithVariants[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as ProductWithVariants[]) ?? [];
  } catch {
    return [];
  }
}

/** Productos de una categoría con filtros de talla/precio y orden. */
export async function getProductsByCategory(
  categorySlug: string,
  filters: CatalogFilters = {}
): Promise<ProductWithVariants[]> {
  try {
    const supabase = await createClient();
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return [];

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .eq("category_id", category.id);

    if (typeof filters.minPrice === "number") {
      query = query.gte("base_price", filters.minPrice);
    }
    if (typeof filters.maxPrice === "number") {
      query = query.lte("base_price", filters.maxPrice);
    }

    switch (filters.sort) {
      case "precio-asc":
        query = query.order("base_price", { ascending: true });
        break;
      case "precio-desc":
        query = query.order("base_price", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    let products = (data as unknown as ProductWithVariants[]) ?? [];

    // Filtro por talla disponible (variante con esa talla y stock > 0).
    if (filters.sizes && filters.sizes.length > 0) {
      const wanted = new Set(filters.sizes);
      products = products.filter((p) =>
        p.variants.some((v) => wanted.has(v.size) && v.stock > 0)
      );
    }

    return products;
  } catch {
    return [];
  }
}

/** Ficha de producto por slug (con categoría y variantes). */
export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as ProductWithVariants | null;
  } catch {
    return null;
  }
}

/** Slugs de todos los productos activos (para enlaces / sugerencias). */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .eq("active", true);
    if (error) throw error;
    return (data ?? []).map((p) => p.slug);
  } catch {
    return [];
  }
}
