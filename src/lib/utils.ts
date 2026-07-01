import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ProductWithVariants } from "@/lib/types/database";

/** Combina clases condicionales y resuelve conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stock total de un producto (suma de sus variantes). Helper puro y seguro
 *  para usar tanto en Server como en Client Components. */
export function totalStock(product: ProductWithVariants): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

/** Formatea un número como precio en euros (locale es-ES). */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/** Genera un slug URL-safe a partir de un texto (soporta acentos y ñ). */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina diacríticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // caracteres no válidos
    .replace(/[\s_-]+/g, "-") // espacios/guiones -> un guion
    .replace(/^-+|-+$/g, ""); // recorta guiones sobrantes
}

/** Formatea una fecha ISO como fecha/hora legible en es-ES. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
