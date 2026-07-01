import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/queries/catalog";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Volver a productos
      </Link>
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
