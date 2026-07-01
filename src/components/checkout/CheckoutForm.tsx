"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SHIPPING_COUNTRIES } from "@/lib/constants";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { useCartStore, useCartSubtotal } from "@/lib/store/cart";
import { formatEUR } from "@/lib/utils";

export function CheckoutForm() {
  const router = useRouter();
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();

  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<string>(SHIPPING_COUNTRIES[0]);

  // Carrito vacío -> volver al carrito.
  useEffect(() => {
    if (hasHydrated && items.length === 0 && !loading) {
      router.replace("/carrito");
    }
  }, [hasHydrated, items.length, loading, router]);

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const result = await createCheckoutSession(
      {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        postalCode: String(form.get("postalCode") ?? ""),
        country,
      },
      items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    );

    if (result.ok) {
      // Redirige a Stripe Checkout (hosted).
      window.location.href = result.url;
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Finalizar compra</h1>

      <form
        onSubmit={onSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        {/* Datos de envío */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Datos de contacto y envío</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                required
                autoComplete="street-address"
                placeholder="Calle, número, piso..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" required autoComplete="address-level2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                name="postalCode"
                required
                autoComplete="postal-code"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="country">País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Resumen del pedido */}
        <aside className="h-fit space-y-4 rounded-xl border p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Tu pedido</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <span className="line-clamp-1 font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    Talla {item.size} · x{item.quantity}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatEUR(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between border-t pt-4 text-base font-bold">
            <span>Total</span>
            <span>{formatEUR(subtotal)}</span>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || items.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirigiendo a Stripe...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Pagar {formatEUR(subtotal)}
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <Lock className="size-3" />
            Pago seguro con Stripe
          </p>
        </aside>
      </form>
    </div>
  );
}
