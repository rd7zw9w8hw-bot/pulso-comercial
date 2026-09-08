"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esFechaISO, hoyISO } from "@/lib/periodos";

export type EstadoForm = { ok?: string; error?: string };

function leerTexto(valor: FormDataEntryValue | null): string | null {
  const t = String(valor ?? "").trim();
  return t.length > 0 ? t : null;
}

function leerMonto(valor: FormDataEntryValue | null): number {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

export async function crearOportunidad(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { user, supabase } = await requerirSesion();

  const cliente = leerTexto(formData.get("cliente"));
  const descripcion = leerTexto(formData.get("descripcion"));
  const monto_estimado = leerMonto(formData.get("monto_estimado"));
  const fecha_creacion = String(formData.get("fecha_creacion") ?? "");
  const nota = leerTexto(formData.get("nota"));

  if (!cliente) return { error: "El cliente es obligatorio." };
  if (!esFechaISO(fecha_creacion)) return { error: "La fecha no es válida." };

  const { error } = await supabase.from("oportunidades").insert({
    vendedor_id: user.id,
    cliente,
    descripcion,
    monto_estimado,
    estado: "abierta",
    fecha_creacion,
    nota,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/oportunidades");
  return { ok: "Oportunidad creada." };
}

export async function actualizarOportunidad(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();

  const id = Number(formData.get("id"));
  const cliente = leerTexto(formData.get("cliente"));
  const descripcion = leerTexto(formData.get("descripcion"));
  const monto_estimado = leerMonto(formData.get("monto_estimado"));
  const fecha_creacion = String(formData.get("fecha_creacion") ?? "");
  const nota = leerTexto(formData.get("nota"));

  if (!id || !cliente || !esFechaISO(fecha_creacion)) return;

  await supabase
    .from("oportunidades")
    .update({ cliente, descripcion, monto_estimado, fecha_creacion, nota })
    .eq("id", id);

  revalidatePath("/oportunidades");
}

/** Cierra una oportunidad como ganada o perdida. Si es "ganada", puede
 *  enlazar una venta existente o crear una nueva con el monto indicado. */
export async function cambiarEstado(formData: FormData): Promise<void> {
  const { user, supabase } = await requerirSesion();

  const id = Number(formData.get("id"));
  const nuevoEstado = String(formData.get("estado") ?? "");
  if (!id || (nuevoEstado !== "ganada" && nuevoEstado !== "perdida")) return;

  const fecha_cierre = String(formData.get("fecha_cierre") ?? "") || hoyISO();
  if (!esFechaISO(fecha_cierre)) return;

  let venta_id: number | null = null;

  if (nuevoEstado === "ganada") {
    const ventaExistente = Number(formData.get("venta_id"));
    const montoNuevaVenta = leerMonto(formData.get("monto_venta"));

    if (ventaExistente > 0) {
      venta_id = ventaExistente;
    } else if (montoNuevaVenta > 0) {
      const { data: op } = await supabase
        .from("oportunidades")
        .select("cliente")
        .eq("id", id)
        .maybeSingle<{ cliente: string }>();

      const { data: nuevaVenta } = await supabase
        .from("ventas")
        .insert({
          vendedor_id: user.id,
          fecha: fecha_cierre,
          monto: montoNuevaVenta,
          cliente: op?.cliente ?? null,
          nota: "Generada al ganar la oportunidad",
        })
        .select("id")
        .maybeSingle<{ id: number }>();

      venta_id = nuevaVenta?.id ?? null;
    }
  }

  await supabase
    .from("oportunidades")
    .update({ estado: nuevoEstado, fecha_cierre, venta_id })
    .eq("id", id);

  revalidatePath("/oportunidades");
  revalidatePath("/ventas");
}

export async function reabrirOportunidad(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();
  const id = Number(formData.get("id"));
  if (!id) return;

  await supabase
    .from("oportunidades")
    .update({ estado: "abierta", fecha_cierre: null, venta_id: null })
    .eq("id", id);

  revalidatePath("/oportunidades");
}

export async function borrarOportunidad(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();
  const id = Number(formData.get("id"));
  if (!id) return;

  await supabase.from("oportunidades").delete().eq("id", id);
  revalidatePath("/oportunidades");
}
