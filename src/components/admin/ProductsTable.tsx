"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, toggleProductActive } from "@/lib/actions/products";
import { formatEUR, totalStock } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/types/database";
import { useRouter } from "next/navigation";

export function ProductsTable({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ProductWithVariants | null>(null);

  function handleToggle(product: ProductWithVariants) {
    startTransition(async () => {
      const res = await toggleProductActive(product.id, !product.active);
      if (res.ok) {
        toast.success(product.active ? "Producto ocultado" : "Producto activado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    const product = toDelete;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.ok) {
        toast.success(
          res.softDeleted
            ? "El producto tenía pedidos: se ha ocultado en lugar de borrarse."
            : "Producto eliminado"
        );
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        Aún no hay productos. Crea el primero con “Nuevo producto”.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    /{product.slug}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatEUR(product.base_price)}
                </TableCell>
                <TableCell className="text-right">
                  {totalStock(product)}
                </TableCell>
                <TableCell>
                  {product.active ? (
                    <Badge variant="secondary">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Oculto</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label="Editar"
                    >
                      <Link href={`/admin/productos/${product.id}/editar`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => handleToggle(product)}
                      aria-label={product.active ? "Ocultar" : "Activar"}
                    >
                      {product.active ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setToDelete(product)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar “{toDelete?.name}”? Si tiene pedidos
              asociados, se ocultará en lugar de borrarse para conservar el
              histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
