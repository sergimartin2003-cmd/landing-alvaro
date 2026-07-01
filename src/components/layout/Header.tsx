import Link from "next/link";

import { CartSheet } from "@/components/cart/CartSheet";
import { MobileNav } from "@/components/layout/MobileNav";
import { STORE_NAME } from "@/lib/constants";
import { getCategories } from "@/lib/queries/catalog";

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <MobileNav categories={categories} />

        <Link href="/" className="flex items-center gap-1 font-bold text-xl">
          <span className="tracking-tight">{STORE_NAME}</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/tienda/${c.slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
