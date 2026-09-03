import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rangoMes, rangoAnio, type Periodo } from "@/lib/periodos";
import {
  desempenoVendedor,
  desempenoEquipo,
  type DesempenoVendedor,
  type DesempenoEquipo,
  type MetaMensualValores,
} from "@/lib/calculos";

type Cliente = SupabaseClient;

type FilaMonto = { monto: number | string };
type FilaTipo = { tipo: string };

/** Desempeño de un vendedor concreto en un período (mes/año). */
export async function cargarDesempenoVendedor(
  supabase: Cliente,
  vendedorId: string,
  periodo: Periodo,
): Promise<DesempenoVendedor> {
  const mes = rangoMes(periodo);
  const anio = rangoAnio(periodo.anio);

  const [ventasMes, ventasAnio, actividadesMes, metaMensual, metaAnual] =
    await Promise.all([
      supabase
        .from("ventas")
        .select("monto")
        .eq("vendedor_id", vendedorId)
        .gte("fecha", mes.desde)
        .lte("fecha", mes.hasta)
        .returns<FilaMonto[]>(),
      supabase
        .from("ventas")
        .select("monto")
        .eq("vendedor_id", vendedorId)
        .gte("fecha", anio.desde)
        .lte("fecha", anio.hasta)
        .returns<FilaMonto[]>(),
      supabase
        .from("actividades")
        .select("tipo")
        .eq("vendedor_id", vendedorId)
        .gte("fecha", mes.desde)
        .lte("fecha", mes.hasta)
        .returns<FilaTipo[]>(),
      supabase
        .from("metas_mensuales")
        .select(
          "meta_ventas, meta_contactos, meta_reuniones, meta_oportunidades, meta_propuestas",
        )
        .eq("vendedor_id", vendedorId)
        .eq("anio", periodo.anio)
        .eq("mes", periodo.mes)
        .maybeSingle<MetaMensualValores>(),
      supabase
        .from("metas_anuales")
        .select("meta_ventas_anual")
        .eq("vendedor_id", vendedorId)
        .eq("anio", periodo.anio)
        .maybeSingle<{ meta_ventas_anual: number }>(),
    ]);

  return desempenoVendedor({
    ventasMes: ventasMes.data ?? [],
    ventasAnio: ventasAnio.data ?? [],
    actividadesMes: actividadesMes.data ?? [],
    metaMensual: metaMensual.data ?? null,
    metaVentasAnual: metaAnual.data?.meta_ventas_anual ?? null,
  });
}

type FilaVendedorMonto = { vendedor_id: string; monto: number | string };
type FilaVendedorTipo = { vendedor_id: string; tipo: string };

function agruparPorVendedor<T extends { vendedor_id: string }>(
  filas: T[] | null,
): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const fila of filas ?? []) {
    const grupo = mapa.get(fila.vendedor_id) ?? [];
    grupo.push(fila);
    mapa.set(fila.vendedor_id, grupo);
  }
  return mapa;
}

/** Desempeño consolidado de todo el equipo en un período. */
export async function cargarDesempenoEquipo(
  supabase: Cliente,
  periodo: Periodo,
): Promise<DesempenoEquipo> {
  const mes = rangoMes(periodo);
  const anio = rangoAnio(periodo.anio);

  const [perfiles, ventasMes, ventasAnio, actividadesMes, metasMes, metasAnio] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nombre, activo")
        .eq("rol", "vendedor")
        .order("nombre")
        .returns<{ id: string; nombre: string; activo: boolean }[]>(),
      supabase
        .from("ventas")
        .select("vendedor_id, monto")
        .gte("fecha", mes.desde)
        .lte("fecha", mes.hasta)
        .returns<FilaVendedorMonto[]>(),
      supabase
        .from("ventas")
        .select("vendedor_id, monto")
        .gte("fecha", anio.desde)
        .lte("fecha", anio.hasta)
        .returns<FilaVendedorMonto[]>(),
      supabase
        .from("actividades")
        .select("vendedor_id, tipo")
        .gte("fecha", mes.desde)
        .lte("fecha", mes.hasta)
        .returns<FilaVendedorTipo[]>(),
      supabase
        .from("metas_mensuales")
        .select("vendedor_id, meta_ventas")
        .eq("anio", periodo.anio)
        .eq("mes", periodo.mes)
        .returns<{ vendedor_id: string; meta_ventas: number | string }[]>(),
      supabase
        .from("metas_anuales")
        .select("vendedor_id, meta_ventas_anual")
        .eq("anio", periodo.anio)
        .returns<
          { vendedor_id: string; meta_ventas_anual: number | string }[]
        >(),
    ]);

  const vMes = agruparPorVendedor(ventasMes.data);
  const vAnio = agruparPorVendedor(ventasAnio.data);
  const aMes = agruparPorVendedor(actividadesMes.data);
  const metaMes = new Map(
    (metasMes.data ?? []).map((m) => [m.vendedor_id, Number(m.meta_ventas)]),
  );
  const metaAnio = new Map(
    (metasAnio.data ?? []).map((m) => [
      m.vendedor_id,
      Number(m.meta_ventas_anual),
    ]),
  );

  return desempenoEquipo(
    (perfiles.data ?? []).map((p) => ({
      vendedorId: p.id,
      nombre: p.nombre,
      activo: p.activo,
      ventasMes: vMes.get(p.id) ?? [],
      ventasAnio: vAnio.get(p.id) ?? [],
      actividadesMes: aMes.get(p.id) ?? [],
      metaVentasMes: metaMes.get(p.id) ?? 0,
      metaVentasAnio: metaAnio.get(p.id) ?? 0,
    })),
  );
}
