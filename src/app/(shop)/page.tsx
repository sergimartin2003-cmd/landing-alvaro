import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { getCategories, getFeaturedProducts } from "@/lib/queries/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
  ]);

  return (
    <div>
      {/* Hero — placeholder de copy, edítalo cuando quieras */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
          <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nueva temporada · Marca propia
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            {/* PLACEHOLDER: titular de marca */}
            Streetwear que habla por ti
          </h1>
          <p className="max-w-xl text-muted-foreground sm:text-lg">
            {/* PLACEHOLDER: subtítulo/propuesta de valor */}
            Piezas de marca propia GTshop, diseñadas para la calle. Calidad,
            comodidad y actitud en cada prenda.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/tienda/camisetas">Ver la colección</Link>
            </Button>
            {categories[0] && (
              <Button asChild size="lg" variant="outline">
                <Link href={`/tienda/${categories[0].slug}`}>
                  Explorar {categories[0].name}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Bloques de categorías */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-bold">Compra por categoría</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/tienda/${c.slug}`}
              className="group flex aspect-video items-center justify-center rounded-xl border bg-muted/40 p-4 text-center font-semibold transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="group-hover:underline">{c.name}</span>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              Aún no hay categorías. Configura Supabase y ejecuta el seed.
            </p>
          )}
        </div>
      </section>

      {/* Productos destacados */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Destacados</h2>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No hay productos todavía. Da de alta productos desde la Terminal de
            Productos (<code>/admin/productos</code>) o ejecuta el seed.
          </div>
        )}
      </section>
    </div>
  );
}
