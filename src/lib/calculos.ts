/**
 * Fórmulas de Pulso Comercial (ficha §2.4).
 *
 * Todas son funciones puras: reciben datos ya cargados y devuelven números.
 * No consultan la base de datos. Así se pueden probar de forma aislada
 * (ver tests/calculos.test.ts).
 *
 * Convención: un cumplimiento `null` significa "sin meta definida" (meta 0 o
 * inexistente). La interfaz lo muestra como "sin meta" en vez de un porcentaje.
 */

import { CAMPOS_META_ACTIVIDAD } from "@/lib/constantes";

export type Cumplimiento = number | null;

type ConMonto = { monto: number | string };
type ConTipo = { tipo: string };

/** Suma de montos (acepta números o strings numéricos de Postgres `numeric`). */
export function sumaMontos(registros: ConMonto[]): number {
  return registros.reduce((total, r) => total + Number(r.monto), 0);
}

/** Conteo de actividades de un tipo concreto. */
export function contarPorTipo(actividades: ConTipo[], tipo: string): number {
  return actividades.filter((a) => a.tipo === tipo).length;
}

/**
 * Porcentaje de cumplimiento = realizado / meta * 100.
 * Devuelve `null` si la meta no es positiva (sin meta definida).
 */
export function porcentajeCumplimiento(
  realizado: number,
  meta: number,
): Cumplimiento {
  if (!Number.isFinite(meta) || meta <= 0) return null;
  return (realizado / meta) * 100;
}

/** Brecha = meta − realizado. Positiva = falta para la meta; negativa = superada. */
export function brecha(meta: number, realizado: number): number {
  return meta - realizado;
}

// --- Resúmenes de conveniencia ----------------------------------------------

export type ResumenMonetario = {
  realizado: number;
  meta: number;
  cumplimiento: Cumplimiento;
  brecha: number;
};

/** Resumen monetario (mensual o anual) a partir de ventas y una meta. */
export function resumenMonetario(
  ventas: ConMonto[],
  meta: number,
): ResumenMonetario {
  const realizado = sumaMontos(ventas);
  return {
    realizado,
    meta,
    cumplimiento: porcentajeCumplimiento(realizado, meta),
    brecha: brecha(meta, realizado),
  };
}

export type ResumenActividad = {
  tipo: string;
  etiqueta: string;
  etiquetaCorta: string;
  realizado: number;
  meta: number;
  cumplimiento: Cumplimiento;
  brecha: number;
};

/** Resumen de un tipo de actividad frente a su meta mensual. */
export function resumenActividad(
  actividades: ConTipo[],
  tipo: string,
  etiqueta: string,
  etiquetaCorta: string,
  meta: number,
): ResumenActividad {
  const realizado = contarPorTipo(actividades, tipo);
  return {
    tipo,
    etiqueta,
    etiquetaCorta,
    realizado,
    meta,
    cumplimiento: porcentajeCumplimiento(realizado, meta),
    brecha: brecha(meta, realizado),
  };
}

// --- Desempeño de un vendedor en un período --------------------------------

export type MetaMensualValores = {
  meta_ventas: number;
  meta_contactos: number;
  meta_reuniones: number;
  meta_oportunidades: number;
  meta_propuestas: number;
};

export type DesempenoVendedor = {
  mensual: ResumenMonetario;
  anual: ResumenMonetario;
  actividades: ResumenActividad[];
};

/**
 * Reúne todo el desempeño de un vendedor en un período: ventas del mes y del
 * año frente a sus metas, y cada tipo de actividad del mes frente a su meta.
 */
export function desempenoVendedor(input: {
  ventasMes: ConMonto[];
  ventasAnio: ConMonto[];
  actividadesMes: ConTipo[];
  metaMensual: MetaMensualValores | null;
  metaVentasAnual: number | null;
}): DesempenoVendedor {
  const m = input.metaMensual;

  return {
    mensual: resumenMonetario(input.ventasMes, m?.meta_ventas ?? 0),
    anual: resumenMonetario(input.ventasAnio, input.metaVentasAnual ?? 0),
    actividades: CAMPOS_META_ACTIVIDAD.map((c) =>
      resumenActividad(
        input.actividadesMes,
        c.tipo,
        c.etiqueta,
        c.etiquetaCorta,
        (m?.[c.campo as keyof MetaMensualValores] as number | undefined) ?? 0,
      ),
    ),
  };
}

// --- Desempeño del equipo --------------------------------------------------

export type FilaEquipo = {
  vendedorId: string;
  nombre: string;
  activo: boolean;
  mensual: ResumenMonetario;
  anual: ResumenMonetario;
  actividadesMes: number;
};

export type DesempenoEquipo = {
  filas: FilaEquipo[];
  totalMensual: ResumenMonetario;
  totalAnual: ResumenMonetario;
};

type EntradaVendedor = {
  vendedorId: string;
  nombre: string;
  activo: boolean;
  ventasMes: ConMonto[];
  ventasAnio: ConMonto[];
  actividadesMes: ConTipo[];
  metaVentasMes: number;
  metaVentasAnio: number;
};

/**
 * Reúne el desempeño de todo el equipo: una fila por vendedor y los totales
 * consolidados (mensual y anual).
 */
export function desempenoEquipo(vendedores: EntradaVendedor[]): DesempenoEquipo {
  const filas: FilaEquipo[] = vendedores.map((v) => ({
    vendedorId: v.vendedorId,
    nombre: v.nombre,
    activo: v.activo,
    mensual: resumenMonetario(v.ventasMes, v.metaVentasMes),
    anual: resumenMonetario(v.ventasAnio, v.metaVentasAnio),
    actividadesMes: v.actividadesMes.length,
  }));

  const suma = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

  const realizadoMes = suma(filas.map((f) => f.mensual.realizado));
  const metaMes = suma(filas.map((f) => f.mensual.meta));
  const realizadoAnio = suma(filas.map((f) => f.anual.realizado));
  const metaAnio = suma(filas.map((f) => f.anual.meta));

  return {
    filas,
    totalMensual: {
      realizado: realizadoMes,
      meta: metaMes,
      cumplimiento: porcentajeCumplimiento(realizadoMes, metaMes),
      brecha: brecha(metaMes, realizadoMes),
    },
    totalAnual: {
      realizado: realizadoAnio,
      meta: metaAnio,
      cumplimiento: porcentajeCumplimiento(realizadoAnio, metaAnio),
      brecha: brecha(metaAnio, realizadoAnio),
    },
  };
}
