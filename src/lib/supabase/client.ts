import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * Cliente de Supabase para el navegador (Client Components).
 * Usa la clave pública anónima: la RLS protege los datos.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
