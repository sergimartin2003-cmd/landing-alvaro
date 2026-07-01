import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold">404</p>
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Lo sentimos, no hemos encontrado lo que buscabas.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
