"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esFechaISO } from "@/lib/periodos";

export type EstadoForm = { ok?: string; error?: string };

function leerTexto(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

function leerMonto(valor: FormDataEntryValue | null): number | null {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function crearVenta(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { user, supabase } = await requerirSesion();

  const fecha = String(formData.get("fecha") ?? "");
  const monto = leerMonto(formData.get("monto"));
  const cliente = leerTexto(formData.get("cliente"));
  const nota = leerTexto(formData.get("nota"));

  if (!esFechaISO(fecha)) return { error: "La fecha no es válida." };
  if (monto === null) return { error: "El monto debe ser un número mayor o igual a 0." };

  const { error } = await supabase.from("ventas").insert({
    vendedor_id: user.id,
    fecha,
    monto,
    cliente,
    nota,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/ventas");
  return { ok: "Venta registrada." };
}

export async function actualizarVenta(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();

  const id = Number(formData.get("id"));
  const fecha = String(formData.get("fecha") ?? "");
  const monto = leerMonto(formData.get("monto"));
  const cliente = leerTexto(formData.get("cliente"));
  const nota = leerTexto(formData.get("nota"));

  if (!id || !esFechaISO(fecha) || monto === null) return;

  await supabase
    .from("ventas")
    .update({ fecha, monto, cliente, nota })
    .eq("id", id);

  revalidatePath("/ventas");
}

export async function borrarVenta(formData: FormData): Promise<void> {
  const { supabase } = await requerirSesion();
  const id = Number(formData.get("id"));
  if (!id) return;

  await supabase.from("ventas").delete().eq("id", id);
  revalidatePath("/ventas");
}
