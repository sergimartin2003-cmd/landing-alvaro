import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/types/database";

/**
 * Refresca la sesión de Supabase en cada request y protege /admin/*.
 * Se invoca desde `proxy.ts` (el antiguo middleware.ts en Next.js 16).
 *
 * - Sin sesión o sin rol admin en una ruta /admin/* -> redirige a /admin/login.
 * - Con sesión admin en /admin/login -> redirige al panel de pedidos.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path === "/admin/login";

  // Solo consultamos el rol admin cuando de verdad hace falta (rutas /admin).
  let isAdmin = false;
  if (user && isAdminRoute) {
    const { data } = await supabase.rpc("is_admin");
    isAdmin = data === true;
  }

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const res = NextResponse.redirect(url);
    // Conserva las cookies de sesión refrescadas.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie);
    });
    return res;
  };

  if (isAdminRoute && !isLoginRoute && (!user || !isAdmin)) {
    return redirectTo("/admin/login");
  }

  if (isLoginRoute && user && isAdmin) {
    return redirectTo("/admin/pedidos");
  }

  return supabaseResponse;
}
