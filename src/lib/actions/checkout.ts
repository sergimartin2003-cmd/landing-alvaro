"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CheckoutLine {
  variantId: string;
  quantity: number;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/**
 * Crea un pedido `pendiente` recalculando precios y stock desde la BD
 * (nunca se confía en el precio del cliente) y abre una Stripe Checkout
 * Session. Devuelve la URL de pago o un error.
 */
export async function createCheckoutSession(
  customer: CheckoutCustomer,
  lines: CheckoutLine[]
): Promise<CheckoutResult> {
  // --- Validación básica del formulario ---
  const required: [keyof CheckoutCustomer, string][] = [
    ["name", "nombre"],
    ["email", "email"],
    ["address", "dirección"],
    ["city", "ciudad"],
    ["postalCode", "código postal"],
    ["country", "país"],
  ];
  for (const [key, label] of required) {
    if (!customer[key]?.trim()) {
      return { ok: false, error: `Falta el campo ${label}.` };
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return { ok: false, error: "El email no es válido." };
  }
  if (!lines.length) {
    return { ok: false, error: "El carrito está vacío." };
  }

  // Consolidar cantidades por variante (por si llegan duplicadas).
  const qtyByVariant = new Map<string, number>();
  for (const l of lines) {
    if (!l.variantId || l.quantity <= 0) continue;
    qtyByVariant.set(
      l.variantId,
      (qtyByVariant.get(l.variantId) ?? 0) + Math.floor(l.quantity)
    );
  }
  const variantIds = [...qtyByVariant.keys()];
  if (!variantIds.length) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const admin = createAdminClient();

  // --- Traer las variantes autoritativas (precio/stock/nombre) desde la BD ---
  const { data: variants, error: variantsError } = await admin
    .from("product_variants")
    .select(
      "id, size, stock, product_id, products(id, name, base_price, active)"
    )
    .in("id", variantIds);

  if (variantsError) {
    return { ok: false, error: "No se pudieron validar los productos." };
  }

  type VariantRow = {
    id: string;
    size: string;
    stock: number;
    product_id: string;
    products: {
      id: string;
      name: string;
      base_price: number;
      active: boolean;
    } | null;
  };

  const rows = (variants ?? []) as unknown as VariantRow[];

  const orderItems: {
    product_id: string;
    variant_id: string;
    product_name: string;
    size: string;
    quantity: number;
    unit_price: number;
  }[] = [];
  const stripeLineItems: {
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string };
    };
    quantity: number;
  }[] = [];
  let total = 0;

  for (const [variantId, quantity] of qtyByVariant) {
    const v = rows.find((r) => r.id === variantId);
    if (!v || !v.products || !v.products.active) {
      return {
        ok: false,
        error: "Uno de los productos ya no está disponible.",
      };
    }
    if (v.stock < quantity) {
      return {
        ok: false,
        error: `Stock insuficiente de "${v.products.name}" (talla ${v.size}). Quedan ${v.stock}.`,
      };
    }

    const unitPrice = Number(v.products.base_price);
    total += unitPrice * quantity;

    orderItems.push({
      product_id: v.product_id,
      variant_id: v.id,
      product_name: v.products.name,
      size: v.size,
      quantity,
      unit_price: unitPrice,
    });

    stripeLineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: Math.round(unitPrice * 100),
        product_data: {
          name: v.products.name,
          description: `Talla ${v.size}`,
        },
      },
      quantity,
    });
  }

  total = Math.round(total * 100) / 100;

  // --- Crear el pedido pendiente + líneas ---
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone.trim() || null,
      shipping_address: customer.address.trim(),
      shipping_city: customer.city.trim(),
      shipping_postal_code: customer.postalCode.trim(),
      shipping_country: customer.country.trim(),
      total_amount: total,
      status: "pendiente",
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "No se pudo crear el pedido." };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    orderItems.map((item) => ({ ...item, order_id: order.id }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "No se pudieron guardar las líneas del pedido." };
  }

  // --- Crear la Stripe Checkout Session ---
  try {
    const stripe = getStripe();
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: stripeLineItems,
      customer_email: customer.email.trim(),
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: order.order_number },
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/carrito`,
      shipping_address_collection: undefined,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de pago.");
    }
    return { ok: true, url: session.url };
  } catch (err) {
    // Si Stripe falla, deshacemos el pedido pendiente.
    await admin.from("orders").delete().eq("id", order.id);
    const message =
      err instanceof Error ? err.message : "Error creando el pago.";
    return { ok: false, error: message };
  }
}
