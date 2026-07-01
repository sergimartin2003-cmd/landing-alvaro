"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatEUR } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/types/database";

export function ProductPurchase({
  product,
}: {
  product: ProductWithVariants;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Ordena las variantes por talla de forma estable.
  const variants = [...product.variants].sort((a, b) =>
    a.size.localeCompare(b.size, "es", { numeric: true })
  );
  const selected = variants.find((v) => v.id === variantId) ?? null;
  const maxQty = selected?.stock ?? 0;

  function handleSelect(id: string, stock: number) {
    if (stock <= 0) return;
    setVariantId(id);
    setQuantity(1);
  }

  function handleAdd() {
    if (!selected) {
      toast.error("Selecciona una talla");
      return;
    }
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size: selected.size,
        unitPrice: product.base_price,
        image: product.images?.[0] ?? null,
        maxStock: selected.stock,
      },
      quantity
    );
    toast.success("Añadido al carrito", {
      description: `${product.name} · Talla ${selected.size} · x${quantity}`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-2xl font-bold">{formatEUR(product.base_price)}</p>

      {/* Selector de talla */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Talla</span>
          {selected && (
            <span className="text-xs text-muted-foreground">
              {selected.stock} disponibles
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const disabled = v.stock <= 0;
            const isActive = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(v.id, v.stock)}
                className={cn(
                  "min-w-11 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  !isActive && !disabled && "hover:border-primary",
                  disabled &&
                    "cursor-not-allowed text-muted-foreground line-through opacity-50"
                )}
                aria-label={`Talla ${v.size}${disabled ? " (agotada)" : ""}`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de cantidad */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Cantidad</span>
        <div className="flex w-fit items-center rounded-md border">
          <button
            type="button"
            aria-label="Restar"
            className="grid size-10 place-items-center disabled:opacity-40"
            disabled={!selected || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Sumar"
            className="grid size-10 place-items-center disabled:opacity-40"
            disabled={!selected || quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <Button size="lg" className="w-full sm:w-auto" onClick={handleAdd}>
        <ShoppingBag className="size-5" />
        Añadir al carrito
      </Button>
    </div>
  );
}
