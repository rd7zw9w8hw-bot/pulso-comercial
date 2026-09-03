import type { Cumplimiento } from "@/lib/calculos";
import { porcentaje } from "@/lib/formato";

/**
 * Barra de progreso neutra para un porcentaje de cumplimiento.
 *
 * En el MVP NO se clasifica el desempeño por colores (ficha §3.3): la barra es
 * gris y solo acompaña al número. Cuando se definan los umbrales
 * verde/amarillo/rojo, este es el punto donde se aplicaría el color.
 */
export function BarraProgreso({ cumplimiento }: { cumplimiento: Cumplimiento }) {
  const relleno =
    cumplimiento === null ? 0 : Math.max(0, Math.min(100, cumplimiento));
  const superaMeta = cumplimiento !== null && cumplimiento > 100;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-valuenow={cumplimiento ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-zinc-700"
          style={{ width: `${relleno}%` }}
        />
      </div>
      <span className="w-20 shrink-0 text-right text-xs text-zinc-600">
        {porcentaje(cumplimiento)}
        {superaMeta ? " ✓" : ""}
      </span>
    </div>
  );
}
