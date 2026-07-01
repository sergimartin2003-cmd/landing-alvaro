"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCartStore,
  useCartSubtotal,
} from "@/lib/store/cart";
import { formatEUR } from "@/lib/utils";

export default function CartPage() {
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartSubtotal();

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="mb-6 h-9 w-40" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground">
          Añade algunas prendas y vuelve aquí para finalizar tu compra.
        </p>
        <Button asChild size="lg">
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Carrito</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Lista de items */}
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 p-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="font-semibold">
                    {formatEUR(item.unitPrice * item.quantity)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Talla {item.size} · {formatEUR(item.unitPrice)} /ud
                </span>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      aria-label="Restar"
                      className="grid size-8 place-items-center disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Sumar"
                      className="grid size-8 place-items-center disabled:opacity-40"
                      disabled={item.quantity >= item.maxStock}
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Resumen */}
        <aside className="h-fit rounded-xl border p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatEUR(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className="text-muted-foreground">Se calcula al pagar</span>
          </div>
          <div className="mt-4 flex justify-between border-t pt-4 text-base font-bold">
            <span>Total</span>
            <span>{formatEUR(subtotal)}</span>
          </div>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link href="/checkout">Finalizar compra</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
            <Link href="/">Seguir comprando</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
