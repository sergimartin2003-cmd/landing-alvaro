import "server-only";
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/**
 * Instancia de Stripe (solo servidor). Se crea de forma perezosa para no
 * fallar en build si la clave aún no está configurada.
 */
export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
    }
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return stripeSingleton;
}
