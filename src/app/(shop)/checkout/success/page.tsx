"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";

export default function CheckoutSuccessPage() {
  const clear = useCartStore((s) => s.clear);

  // Vacía el carrito tras un pago correcto.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center">
      <CheckCircle2 className="size-16 text-emerald-600" />
      <h1 className="text-3xl font-bold">¡Gracias por tu compra!</h1>
      <p className="text-muted-foreground">
        Hemos recibido tu pago y tu pedido está en proceso. Te enviaremos un
        email con la confirmación y el seguimiento del envío.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
}
