"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLOTHING_SIZES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { VariantInput } from "@/lib/actions/products";

export function VariantEditor({
  value,
  onChange,
  productName,
}: {
  value: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
  productName: string;
}) {
  function suggestSku(size: string): string {
    const base = slugify(productName || "prod").toUpperCase().slice(0, 12);
    return `GT-${base}-${size.toUpperCase()}`.replace(/-+/g, "-");
  }

  function addVariant(size = "") {
    if (size && value.some((v) => v.size.toLowerCase() === size.toLowerCase()))
      return;
    onChange([...value, { size, stock: 0, sku: size ? suggestSku(size) : "" }]);
  }

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const usedSizes = new Set(value.map((v) => v.size.toUpperCase()));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <span className="mr-1 self-center text-xs text-muted-foreground">
          Añadir rápido:
        </span>
        {CLOTHING_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            disabled={usedSizes.has(size)}
            onClick={() => addVariant(size)}
            className="rounded-md border px-2 py-1 text-xs font-medium hover:border-primary disabled:opacity-40"
          >
            {size}
          </button>
        ))}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_100px_1fr_40px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
            <span>Talla</span>
            <span>Stock</span>
            <span>SKU</span>
            <span />
          </div>
          {value.map((variant, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_100px_1fr_40px] sm:border-0 sm:p-0"
            >
              <div className="space-y-1 sm:space-y-0">
                <Label className="text-xs sm:hidden">Talla</Label>
                <Input
                  value={variant.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                  placeholder="M"
                />
              </div>
              <div className="space-y-1 sm:space-y-0">
                <Label className="text-xs sm:hidden">Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(i, { stock: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="col-span-2 space-y-1 sm:col-span-1 sm:space-y-0">
                <Label className="text-xs sm:hidden">SKU</Label>
                <Input
                  value={variant.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  placeholder="GT-XXX-M"
                />
              </div>
              <div className="col-span-2 flex justify-end sm:col-span-1 sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariant(i)}
                  aria-label="Quitar variante"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => addVariant()}>
        <Plus className="size-4" />
        Añadir talla
      </Button>
    </div>
  );
}
