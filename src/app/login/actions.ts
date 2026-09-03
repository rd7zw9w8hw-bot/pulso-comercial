"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { error?: string };

export async function iniciarSesion(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduce tu correo y tu contraseña." };
  }

  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("activo")
    .eq("id", data.user.id)
    .single();

  if (perfil && perfil.activo === false) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta está desactivada. Contacta al administrador." };
  }

  redirect("/");
}
