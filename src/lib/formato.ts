import type { Cumplimiento } from "@/lib/calculos";

const SIMBOLO_MONEDA = process.env.NEXT_PUBLIC_MONEDA_SIMBOLO || "$";
const LOCALE = "es";

/** Formatea un importe: "$1.234,56" (símbolo configurable). */
export function moneda(valor: number): string {
  const n = Number(valor).toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  return `${SIMBOLO_MONEDA}${n}`;
}

/**
 * Formatea un cumplimiento. `null` (sin meta) -> "sin meta".
 * Nota: en el MVP no se clasifica el desempeño por colores (ficha §3.3);
 * solo se muestra el porcentaje.
 */
export function porcentaje(valor: Cumplimiento): string {
  if (valor === null) return "sin meta";
  const n = valor.toLocaleString(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return `${n}%`;
}

/** Formatea una fecha ISO (YYYY-MM-DD) como "01/09/2026". */
export function fecha(iso: string): string {
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

/** Texto de la brecha monetaria, teniendo en cuenta el caso "sin meta". */
export function textoBrechaMonetaria(
  cumplimiento: Cumplimiento,
  valorBrecha: number,
): string {
  if (cumplimiento === null) return "sin meta definida";
  if (valorBrecha > 0) return `faltan ${moneda(valorBrecha)}`;
  return `meta superada por ${moneda(-valorBrecha)}`;
}

/** Texto de la brecha de actividad (conteos), teniendo en cuenta "sin meta". */
export function textoBrechaActividad(
  cumplimiento: Cumplimiento,
  valorBrecha: number,
): string {
  if (cumplimiento === null) return "sin meta";
  if (valorBrecha > 0) return `faltan ${valorBrecha}`;
  return "cumplida";
}
