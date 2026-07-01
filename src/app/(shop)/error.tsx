"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Algo ha ido mal</h1>
      <p className="text-sm text-muted-foreground">
        No hemos podido cargar esta página. Inténtalo de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
