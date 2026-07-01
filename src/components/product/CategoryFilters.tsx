"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "novedad", label: "Novedad" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export function CategoryFilters({
  availableSizes,
}: {
  availableSizes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = (searchParams.get("tallas") ?? "")
    .split(",")
    .filter(Boolean);
  const sort = searchParams.get("orden") ?? "novedad";
  const minPrice = searchParams.get("min") ?? "";
  const maxPrice = searchParams.get("max") ?? "";

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const toggleSize = (size: string) => {
    pushParams((p) => {
      const current = (p.get("tallas") ?? "").split(",").filter(Boolean);
      const next = current.includes(size)
        ? current.filter((s) => s !== size)
        : [...current, size];
      if (next.length) p.set("tallas", next.join(","));
      else p.delete("tallas");
    });
  };

  const hasFilters =
    selectedSizes.length > 0 || minPrice || maxPrice || sort !== "novedad";

  return (
    <div className="flex flex-col gap-5 rounded-xl border p-4">
      <div className="space-y-2">
        <span className="text-sm font-semibold">Ordenar por</span>
        <Select
          value={sort}
          onValueChange={(value) =>
            pushParams((p) => {
              if (value === "novedad") p.delete("orden");
              else p.set("orden", value);
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableSizes.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-semibold">Talla disponible</span>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "min-w-10 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-semibold">Precio (€)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Mín"
            defaultValue={minPrice}
            onBlur={(e) =>
              pushParams((p) => {
                if (e.target.value) p.set("min", e.target.value);
                else p.delete("min");
              })
            }
            className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Máx"
            defaultValue={maxPrice}
            onBlur={(e) =>
              pushParams((p) => {
                if (e.target.value) p.set("max", e.target.value);
                else p.delete("max");
              })
            }
            className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
          />
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
