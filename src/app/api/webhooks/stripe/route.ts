import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// El webhook necesita el cuerpo crudo para verificar la firma.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] Falta STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "firma inválida";
    console.error("[stripe-webhook] Firma inválida:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, {
      status: 400,
    });
  }

  // Solo nos interesa la sesión de checkout completada y pagada.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "no_pagado" });
    }

    const orderId =
      session.metadata?.order_id ?? session.client_reference_id ?? null;

    if (!orderId) {
      console.error("[stripe-webhook] Sesión sin order_id", session.id);
      return NextResponse.json({ received: true, skipped: "sin_order_id" });
    }

    try {
      const admin = createAdminClient();
      const { error } = await admin.rpc("confirm_order_paid", {
        p_order_id: orderId,
        p_session_id: session.id,
      });
      if (error) throw error;
    } catch (err) {
      // Devolvemos 500 para que Stripe reintente el evento.
      console.error("[stripe-webhook] Error confirmando pedido:", err);
      return NextResponse.json(
        { error: "No se pudo confirmar el pedido" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
