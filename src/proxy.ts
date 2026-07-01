import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// En Next.js 16 el antiguo `middleware.ts` se llama `proxy.ts`.
// Refresca la sesión de Supabase y protege las rutas /admin/*.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Se ejecuta en todas las rutas excepto:
     * - api (route handlers, incluido el webhook de Stripe)
     * - _next/static y _next/image (assets)
     * - archivos estáticos con extensión de imagen y favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
