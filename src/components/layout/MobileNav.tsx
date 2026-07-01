"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { STORE_NAME } from "@/lib/constants";
import type { Category } from "@/lib/types/database";

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>{STORE_NAME}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Inicio
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/tienda/${c.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
