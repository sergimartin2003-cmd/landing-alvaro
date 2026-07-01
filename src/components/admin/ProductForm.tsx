"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { VariantEditor } from "@/components/admin/VariantEditor";
import {
  createProduct,
  updateProduct,
  type ProductInput,
  type VariantInput,
} from "@/lib/actions/products";
import type { Category, ProductWithVariants } from "@/lib/types/database";
import { slugify } from "@/lib/utils";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithVariants;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? String(product.base_price) : ""
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const input: ProductInput = {
      name,
      slug,
      description,
      categoryId,
      basePrice: Number(basePrice) || 0,
      images,
      active,
      variants,
    };

    const result = isEdit
      ? await updateProduct(product!.id, input)
      : await createProduct(input);

    if (result.ok) {
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      router.push("/admin/productos");
      router.refresh();
    } else {
      toast.error(result.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Columna principal */}
      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Información básica</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              placeholder="Camiseta Oversize GT Basic"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="camiseta-oversize-gt-basic"
            />
            <p className="text-xs text-muted-foreground">
              /producto/{slug || "..."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Detalles del producto, materiales, cuidados..."
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Imágenes</h2>
          <ImageUploader value={images} onChange={setImages} />
        </section>

        <section className="space-y-4 rounded-xl border bg-background p-5">
          <div>
            <h2 className="font-semibold">Tallas y stock</h2>
            <p className="text-sm text-muted-foreground">
              Añade una fila por talla con su stock y SKU único.
            </p>
          </div>
          <VariantEditor
            value={variants}
            onChange={setVariants}
            productName={name}
          />
        </section>
      </div>

      {/* Columna lateral */}
      <aside className="h-fit space-y-6 lg:sticky lg:top-24">
        <section className="space-y-4 rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Organización</h2>
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Precio base (€)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              placeholder="24.90"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium">Activo en la tienda</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
        </section>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/productos")}
          >
            Cancelar
          </Button>
        </div>
      </aside>
    </form>
  );
}
