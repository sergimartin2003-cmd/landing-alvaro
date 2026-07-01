"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Error en el panel</h1>
      <p className="text-sm text-muted-foreground">
        Ha ocurrido un error cargando esta sección.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
