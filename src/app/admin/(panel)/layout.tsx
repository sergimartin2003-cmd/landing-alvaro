import Link from "next/link";
import { LogOut } from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { STORE_NAME } from "@/lib/constants";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa en profundidad además del proxy.
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/admin/pedidos" className="font-bold">
            {STORE_NAME}{" "}
            <span className="text-muted-foreground">· Admin</span>
          </Link>
          <div className="ml-2">
            <AdminNav />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/" target="_blank">
                Ver tienda
              </Link>
            </Button>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="size-4" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
