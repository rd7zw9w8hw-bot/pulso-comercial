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

// --- Agregados de conveniencia -------------------------------------------------

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
  realizado: number;
  meta: number;
  cumplimiento: Cumplimiento;
  brecha: number;
};

/** Resumen de un tipo de actividad frente a su meta mensual. */
export function resumenActividad(
  actividades: ConTipo[],
  tipo: string,
  meta: number,
): ResumenActividad {
  const realizado = contarPorTipo(actividades, tipo);
  return {
    tipo,
    realizado,
    meta,
    cumplimiento: porcentajeCumplimiento(realizado, meta),
    brecha: brecha(meta, realizado),
  };
}
