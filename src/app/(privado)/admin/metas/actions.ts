"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/auth";

function numero(valor: FormDataEntryValue | null): number {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function entero(valor: FormDataEntryValue | null): number {
  return Math.trunc(numero(valor));
}

export async function guardarMetas(formData: FormData): Promise<void> {
  const { supabase } = await requerirAdmin();

  const vendedorId = String(formData.get("vendedor_id") ?? "");
  const anio = entero(formData.get("anio"));
  const mes = entero(formData.get("mes"));
  if (!vendedorId || anio < 2000 || mes < 1 || mes > 12) return;

  const mensual = {
    vendedor_id: vendedorId,
    anio,
    mes,
    meta_ventas: numero(formData.get("meta_ventas")),
    meta_contactos: entero(formData.get("meta_contactos")),
    meta_reuniones: entero(formData.get("meta_reuniones")),
    meta_oportunidades: entero(formData.get("meta_oportunidades")),
    meta_propuestas: entero(formData.get("meta_propuestas")),
  };

  const anual = {
    vendedor_id: vendedorId,
    anio,
    meta_ventas_anual: numero(formData.get("meta_ventas_anual")),
  };

  await supabase
    .from("metas_mensuales")
    .upsert(mensual, { onConflict: "vendedor_id,anio,mes" });

  await supabase
    .from("metas_anuales")
    .upsert(anual, { onConflict: "vendedor_id,anio" });

  revalidatePath("/admin/metas");
  redirect(
    `/admin/metas?vendedor=${vendedorId}&anio=${anio}&mes=${mes}&guardado=1`,
  );
}
