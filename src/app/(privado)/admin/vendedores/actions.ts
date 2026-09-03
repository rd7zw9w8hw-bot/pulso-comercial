"use server";

import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/auth";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { ROLES, type Rol } from "@/lib/constantes";

export type EstadoForm = { ok?: string; error?: string };

function esEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function leerRol(valor: FormDataEntryValue | null): Rol {
  return ROLES.includes(valor as Rol) ? (valor as Rol) : "vendedor";
}

export async function crearVendedor(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  await requerirAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = leerRol(formData.get("rol"));

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!esEmail(email)) return { error: "El correo no es válido." };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const admin = crearClienteAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (error) {
    const msg = /registered|already/i.test(error.message)
      ? "Ya existe un usuario con ese correo."
      : `No se pudo crear: ${error.message}`;
    return { error: msg };
  }

  revalidatePath("/admin/vendedores");
  return { ok: `${rol === "admin" ? "Administrador" : "Vendedor"} creado: ${email}` };
}

export async function actualizarVendedor(formData: FormData): Promise<void> {
  const { perfil, supabase } = await requerirAdmin();

  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const rol = leerRol(formData.get("rol"));
  if (!id || !nombre) return;

  // No permitir que el admin se quite a sí mismo el rol de administrador.
  const datos: { nombre: string; rol?: Rol } = { nombre };
  if (id !== perfil.id) datos.rol = rol;

  await supabase.from("profiles").update(datos).eq("id", id);
  revalidatePath("/admin/vendedores");
}

export async function alternarActivo(formData: FormData): Promise<void> {
  const { perfil, supabase } = await requerirAdmin();

  const id = String(formData.get("id") ?? "");
  const activar = String(formData.get("activar") ?? "") === "1";
  if (!id || id === perfil.id) return; // no desactivarse a sí mismo

  await supabase.from("profiles").update({ activo: activar }).eq("id", id);
  revalidatePath("/admin/vendedores");
}
