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
type RangoFechas = { desde: string; hasta: string }; // YYYY-MM-DD

export type ConOportunidad = {
  estado: string;
  monto_estimado: number | string;
  fecha_creacion: string;
  fecha_cierre?: string | null;
};

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

// --- Oportunidades (Módulo 5) ---------------------------------------------

export type ResumenOportunidades = {
  creadasMes: number;
  metaCreadas: number;
  cumplimientoCreadas: Cumplimiento;
  brechaCreadas: number;
  abiertas: number; // snapshot actual (estado = 'abierta')
  valorPipeline: number; // Σ monto_estimado de las abiertas
  ganadasMes: number; // cerradas como 'ganada' en el mes
  perdidasMes: number; // cerradas como 'perdida' en el mes
  valorGanadoMes: number;
  tasaConversionMes: Cumplimiento; // ganadas / (ganadas + perdidas) del mes
};

function dentroDe(fecha: string | null | undefined, rango: RangoFechas): boolean {
  return !!fecha && fecha >= rango.desde && fecha <= rango.hasta;
}

/**
 * Resumen de oportunidades de un vendedor: pipeline abierto (actual), creadas
 * del mes frente a la meta, y ganadas/perdidas/conversión del mes.
 */
export function resumenOportunidades(
  oportunidades: ConOportunidad[],
  mes: RangoFechas,
  metaCreadas: number,
): ResumenOportunidades {
  const abiertas = oportunidades.filter((o) => o.estado === "abierta");
  const ganadas = oportunidades.filter(
    (o) => o.estado === "ganada" && dentroDe(o.fecha_cierre, mes),
  );
  const perdidas = oportunidades.filter(
    (o) => o.estado === "perdida" && dentroDe(o.fecha_cierre, mes),
  );
  const creadasMes = oportunidades.filter((o) =>
    dentroDe(o.fecha_creacion, mes),
  ).length;

  const valorPipeline = abiertas.reduce(
    (t, o) => t + Number(o.monto_estimado),
    0,
  );
  const valorGanadoMes = ganadas.reduce(
    (t, o) => t + Number(o.monto_estimado),
    0,
  );

  return {
    creadasMes,
    metaCreadas,
    cumplimientoCreadas: porcentajeCumplimiento(creadasMes, metaCreadas),
    brechaCreadas: brecha(metaCreadas, creadasMes),
    abiertas: abiertas.length,
    valorPipeline,
    ganadasMes: ganadas.length,
    perdidasMes: perdidas.length,
    valorGanadoMes,
    tasaConversionMes: porcentajeCumplimiento(
      ganadas.length,
      ganadas.length + perdidas.length,
    ),
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
  oportunidades: ResumenOportunidades;
};

/**
 * Reúne todo el desempeño de un vendedor en un período: ventas del mes y del
 * año frente a sus metas, cada tipo de actividad del mes, y las oportunidades.
 */
export function desempenoVendedor(input: {
  ventasMes: ConMonto[];
  ventasAnio: ConMonto[];
  actividadesMes: ConTipo[];
  oportunidades: ConOportunidad[];
  mes: RangoFechas;
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
    oportunidades: resumenOportunidades(
      input.oportunidades,
      input.mes,
      m?.meta_oportunidades ?? 0,
    ),
  };
}

// --- Acumulado del año hasta un mes (YTD) ----------------------------------

export type MesResumen = { ventas: number; metaMensual: number };

/**
 * Acumulado del año desde enero hasta `mesHasta` (incluido): suma de ventas y
 * suma de metas mensuales de esos meses. `meses` debe estar ordenado de enero
 * (índice 0) a diciembre (índice 11).
 */
export function acumuladoHasta(
  meses: MesResumen[],
  mesHasta: number,
): ResumenMonetario {
  const hasta = Math.max(0, Math.min(12, Math.trunc(mesHasta)));
  let realizado = 0;
  let meta = 0;
  for (let i = 0; i < hasta; i++) {
    realizado += meses[i]?.ventas ?? 0;
    meta += meses[i]?.metaMensual ?? 0;
  }
  return {
    realizado,
    meta,
    cumplimiento: porcentajeCumplimiento(realizado, meta),
    brecha: brecha(meta, realizado),
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
  oportunidadesAbiertas: number;
  valorPipeline: number;
  conversionMes: Cumplimiento;
};

export type DesempenoEquipo = {
  filas: FilaEquipo[];
  totalMensual: ResumenMonetario;
  totalAnual: ResumenMonetario;
  totalAbiertas: number;
  totalPipeline: number;
  conversionMesEquipo: Cumplimiento;
};

type EntradaVendedor = {
  vendedorId: string;
  nombre: string;
  activo: boolean;
  ventasMes: ConMonto[];
  ventasAnio: ConMonto[];
  actividadesMes: ConTipo[];
  oportunidades: ConOportunidad[];
  metaVentasMes: number;
  metaVentasAnio: number;
};

/**
 * Reúne el desempeño de todo el equipo: una fila por vendedor y los totales
 * consolidados (ventas mensual/anual y oportunidades del mes).
 */
export function desempenoEquipo(
  vendedores: EntradaVendedor[],
  mes: RangoFechas,
): DesempenoEquipo {
  const ops = vendedores.map((v) => resumenOportunidades(v.oportunidades, mes, 0));

  const filas: FilaEquipo[] = vendedores.map((v, i) => ({
    vendedorId: v.vendedorId,
    nombre: v.nombre,
    activo: v.activo,
    mensual: resumenMonetario(v.ventasMes, v.metaVentasMes),
    anual: resumenMonetario(v.ventasAnio, v.metaVentasAnio),
    actividadesMes: v.actividadesMes.length,
    oportunidadesAbiertas: ops[i].abiertas,
    valorPipeline: ops[i].valorPipeline,
    conversionMes: ops[i].tasaConversionMes,
  }));

  const suma = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

  const realizadoMes = suma(filas.map((f) => f.mensual.realizado));
  const metaMes = suma(filas.map((f) => f.mensual.meta));
  const realizadoAnio = suma(filas.map((f) => f.anual.realizado));
  const metaAnio = suma(filas.map((f) => f.anual.meta));

  const ganadas = suma(ops.map((o) => o.ganadasMes));
  const perdidas = suma(ops.map((o) => o.perdidasMes));

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
    totalAbiertas: suma(filas.map((f) => f.oportunidadesAbiertas)),
    totalPipeline: suma(filas.map((f) => f.valorPipeline)),
    conversionMesEquipo: porcentajeCumplimiento(ganadas, ganadas + perdidas),
  };
}
