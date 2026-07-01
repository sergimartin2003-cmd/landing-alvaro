import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { getAdminProducts } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} producto{products.length === 1 ? "" : "s"} en el
            catálogo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="size-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
