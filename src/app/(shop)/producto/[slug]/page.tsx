import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { getProductBySlug } from "@/lib/queries/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.name ?? "Producto",
    description: product?.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-4" />
        {product.category && (
          <>
            <Link
              href={`/tienda/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="size-4" />
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.category?.name && (
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {product.category.name}
              </span>
            )}
            <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          </div>

          <ProductPurchase product={product} />

          {product.description && (
            <div className="space-y-2 border-t pt-6">
              <h2 className="font-semibold">Descripción</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
