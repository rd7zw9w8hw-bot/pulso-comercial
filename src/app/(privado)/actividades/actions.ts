"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esFechaISO } from "@/lib/periodos";
import { VALORES_TIPO_ACTIVIDAD, type TipoActividad } from "@/lib/constantes";

export type EstadoForm = { ok?: string; error?: string };

function leerNota(valor: FormDataEntryValue | null): string | null {
  const nota = String(valor ?? "").trim();
  return nota.length > 0 ? nota : null;
}

export async function crearActividad(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { user, supabase } = await requerirSesion();

  const tipo = String(formData.get("tipo") ?? "") as TipoActividad;
  const fecha = String(formData.get("fecha") ?? "");
  const nota = leerNota(formData.get("nota"));

  if (!VALORES_TIPO_ACTIVIDAD.includes(tipo)) {
    return { error: "Elige un tipo de actividad válido." };
  }
  if (!esFechaISO(fecha)) {
    return { error: "La fecha no es válida." };
  }

  const { error } = await supabase.from("actividades").insert({
    vendedor_id: user.id,
    tipo,
    fecha,
    nota,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/actividades");
  return { ok: "Actividad registrada." };
}

export async function actualizarActividad(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();

  const id = Number(formData.get("id"));
  const tipo = String(formData.get("tipo") ?? "") as TipoActividad;
  const fecha = String(formData.get("fecha") ?? "");
  const nota = leerNota(formData.get("nota"));

  if (!id || !VALORES_TIPO_ACTIVIDAD.includes(tipo) || !esFechaISO(fecha)) {
    return;
  }

  // RLS garantiza que solo se puede modificar la propia (o cualquiera si es admin).
  await supabase
    .from("actividades")
    .update({ tipo, fecha, nota })
    .eq("id", id);

  revalidatePath("/actividades");
}

export async function borrarActividad(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();
  const id = Number(formData.get("id"));
  if (!id) return;

  await supabase.from("actividades").delete().eq("id", id);
  revalidatePath("/actividades");
}
