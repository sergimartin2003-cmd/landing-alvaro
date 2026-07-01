import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CategoryFilters } from "@/components/product/CategoryFilters";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getCategoryBySlug,
  getProductsByCategory,
  type CatalogFilters,
} from "@/lib/queries/catalog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parseFilters(sp: Record<string, string | string[] | undefined>): {
  base: CatalogFilters;
  sizes: string[];
} {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const sortParam = get("orden");
  const sort: CatalogFilters["sort"] =
    sortParam === "precio-asc" || sortParam === "precio-desc"
      ? sortParam
      : "novedad";
  const min = Number(get("min"));
  const max = Number(get("max"));
  return {
    base: {
      sort,
      minPrice: Number.isFinite(min) && get("min") ? min : undefined,
      maxPrice: Number.isFinite(max) && get("max") ? max : undefined,
    },
    sizes: (get("tallas") ?? "").split(",").filter(Boolean),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  return { title: category?.name ?? "Tienda" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: SearchParams;
}) {
  const { categoria } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  const { base, sizes } = parseFilters(sp);

  // Traemos con precio+orden aplicados en SQL (sin filtro de talla) para poder
  // construir la lista de tallas disponibles a partir del set completo.
  const all = await getProductsByCategory(categoria, base);

  const availableSizes = Array.from(
    new Set(
      all.flatMap((p) =>
        p.variants.filter((v) => v.stock > 0).map((v) => v.size)
      )
    )
  ).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

  const products =
    sizes.length > 0
      ? all.filter((p) =>
          p.variants.some((v) => sizes.includes(v.size) && v.stock > 0)
        )
      : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} producto{products.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CategoryFilters availableSizes={availableSizes} />
        </aside>

        <div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              No hay productos que coincidan con los filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
