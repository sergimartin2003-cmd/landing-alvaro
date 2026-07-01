import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatEUR, totalStock } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/types/database";

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const image = product.images?.[0] ?? null;
  const soldOut = totalStock(product) === 0;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}
        {soldOut && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Agotado
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category?.name && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
        <span className="mt-auto pt-1 text-base font-semibold">
          {formatEUR(product.base_price)}
        </span>
      </div>
    </Link>
  );
}
