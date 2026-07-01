import type { OrderStatus } from "@/lib/types/database";

/** Nombre de la marca / tienda. */
export const STORE_NAME = "GTshop";

/** Tallas de ropa habituales (sugerencias rápidas en el editor de variantes). */
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Tallas de calzado (numéricas EU). */
export const SHOE_SIZES = [
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
] as const;

/**
 * Estados del pedido con etiqueta legible, color de badge y el flujo de
 * transición sugerido (para el selector de la Terminal de Ventas).
 */
export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  className: string;
}[] = [
  {
    value: "pendiente",
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    value: "pagado",
    label: "Pagado",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "preparando",
    label: "Preparando",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "enviado",
    label: "Enviado",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    value: "entregado",
    label: "Entregado",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
];

export const ORDER_STATUS_MAP = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s])
) as Record<OrderStatus, (typeof ORDER_STATUSES)[number]>;

/** Bucket de Supabase Storage donde se guardan las imágenes de producto. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Países de envío soportados (por defecto España). */
export const SHIPPING_COUNTRIES = [
  "España",
  "Portugal",
  "Francia",
  "Italia",
  "Alemania",
] as const;
