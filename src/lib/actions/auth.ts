"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

/**
 * Login de admin con email/contraseña. Verifica que el usuario tenga rol
 * admin (is_admin); si no, cierra sesión y devuelve error.
 * Se usa con `useActionState`.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduce email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales incorrectas." };
  }

  // Comprobar rol admin.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene permisos de administrador." };
  }

  redirect("/admin/pedidos");
}

/** Cierra la sesión del admin. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
