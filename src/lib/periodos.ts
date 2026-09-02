/** Un período de análisis: un mes concreto de un año concreto. */
export type Periodo = { anio: number; mes: number }; // mes: 1-12

export const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

/** Período correspondiente a la fecha dada (por defecto, hoy). */
export function periodoActual(fecha = new Date()): Periodo {
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

/**
 * Interpreta los parámetros ?anio=&mes= de la URL. Si faltan o no son válidos,
 * cae al período actual.
 */
export function parsearPeriodo(params: {
  anio?: string | null;
  mes?: string | null;
}): Periodo {
  const hoy = periodoActual();
  const anio = Number(params.anio);
  const mes = Number(params.mes);
  return {
    anio: Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : hoy.anio,
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : hoy.mes,
  };
}

function diaFinal(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Rango [desde, hasta] en formato YYYY-MM-DD que cubre todo el mes del período. */
export function rangoMes({ anio, mes }: Periodo): { desde: string; hasta: string } {
  return { desde: iso(anio, mes, 1), hasta: iso(anio, mes, diaFinal(anio, mes)) };
}

/** Rango [desde, hasta] en formato YYYY-MM-DD que cubre todo el año. */
export function rangoAnio(anio: number): { desde: string; hasta: string } {
  return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
}

/** Etiqueta legible, p. ej. "Septiembre 2026". */
export function etiquetaPeriodo({ anio, mes }: Periodo): string {
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

/** Lista de años para el selector: desde 2 años atrás hasta el actual. */
export function aniosDisponibles(hasta = periodoActual().anio): number[] {
  return [hasta - 2, hasta - 1, hasta];
}
