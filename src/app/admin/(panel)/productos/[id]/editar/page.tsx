import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/queries/catalog";
import { getAdminProduct } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Volver a productos
      </Link>
      <h1 className="text-2xl font-bold">Editar producto</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
