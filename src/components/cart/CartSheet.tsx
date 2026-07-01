"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useCartCount,
  useCartStore,
  useCartSubtotal,
} from "@/lib/store/cart";
import { formatEUR } from "@/lib/utils";

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const count = useCartCount();
  const subtotal = useCartSubtotal();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Abrir carrito"
        >
          <ShoppingBag className="size-5" />
          {hasHydrated && count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu carrito</SheetTitle>
          <SheetDescription>
            {count > 0
              ? `${count} artículo${count === 1 ? "" : "s"} en el carrito`
              : "Aún no has añadido nada."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <ShoppingBag className="size-10" />
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4 py-2">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-1 text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      Talla {item.size}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatEUR(item.unitPrice)}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center rounded-md border">
                        <button
                          type="button"
                          aria-label="Restar"
                          className="grid size-7 place-items-center disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Sumar"
                          className="grid size-7 place-items-center disabled:opacity-40"
                          disabled={item.quantity >= item.maxStock}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        className="ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatEUR(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Los gastos de envío se calculan en el siguiente paso.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/carrito" onClick={() => setOpen(false)}>
                Ver carrito y pagar
              </Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
