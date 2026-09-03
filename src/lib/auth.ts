import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db.types";

/**
 * Devuelve el usuario autenticado y su perfil, o `null` si no hay sesión.
 * También expone el cliente de Supabase ya inicializado para reutilizarlo.
 */
export async function obtenerSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!perfil) return null;

  return { user, perfil, supabase };
}

/**
 * Para Server Components de rutas privadas. Redirige a /login si no hay sesión
 * o si la cuenta está desactivada.
 */
export async function requerirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (!sesion.perfil.activo) redirect("/login?motivo=inactivo");
  return sesion;
}

/** Como requerirSesion, pero además exige rol de administrador. */
export async function requerirAdmin() {
  const sesion = await requerirSesion();
  if (sesion.perfil.rol !== "admin") redirect("/mi-desempeno");
  return sesion;
}
