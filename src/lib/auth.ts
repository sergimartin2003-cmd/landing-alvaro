import "server-only";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Devuelve el usuario autenticado (o null). */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** ¿El usuario actual es admin? (consulta la función is_admin de la BD). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("is_admin");
  return data === true;
}

/**
 * Exige rol admin. Si no hay sesión admin, redirige a /admin/login.
 * Úsalo al principio de las páginas y Server Actions del panel (defensa en
 * profundidad, además del proxy).
 */
export async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }
}
