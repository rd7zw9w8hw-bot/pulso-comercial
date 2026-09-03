import Link from "next/link";
import { requerirAdmin } from "@/lib/auth";
import {
  parsearPeriodo,
  aniosDisponibles,
  periodoActual,
  etiquetaPeriodo,
} from "@/lib/periodos";
import { cargarDesempenoEquipo } from "@/lib/desempeno";
import { moneda, porcentaje, textoBrechaMonetaria } from "@/lib/formato";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { supabase } = await requerirAdmin();
  const sp = await searchParams;

  const periodo = parsearPeriodo({
    anio: typeof sp.anio === "string" ? sp.anio : null,
    mes: typeof sp.mes === "string" ? sp.mes : null,
  });
  const anios = aniosDisponibles(periodoActual().anio + 1);
  const q = `?anio=${periodo.anio}&mes=${periodo.mes}`;

  const equipo = await cargarDesempenoEquipo(supabase, periodo);

  // Principales brechas: vendedores con brecha mensual positiva, mayor primero.
  const brechas = [...equipo.filas]
    .filter((f) => f.mensual.brecha > 0 && f.mensual.meta > 0)
    .sort((a, b) => b.mensual.brecha - a.mensual.brecha)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard del equipo</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Desempeño consolidado · {etiquetaPeriodo(periodo)}
        </p>
      </div>

      <SelectorPeriodo anio={periodo.anio} mes={periodo.mes} anios={anios} />

      <section className="grid gap-3 sm:grid-cols-2">
        <TarjetaIndicador
          etiqueta="Ventas del equipo (mes)"
          valor={moneda(equipo.totalMensual.realizado)}
          detalle={
            <>
              <p>Meta: {moneda(equipo.totalMensual.meta)}</p>
              <p>Cumplimiento: {porcentaje(equipo.totalMensual.cumplimiento)}</p>
              <p>
                Brecha:{" "}
                {textoBrechaMonetaria(
                  equipo.totalMensual.cumplimiento,
                  equipo.totalMensual.brecha,
                )}
              </p>
            </>
          }
        />
        <TarjetaIndicador
          etiqueta={`Ventas del equipo (año ${periodo.anio})`}
          valor={moneda(equipo.totalAnual.realizado)}
          detalle={
            <>
              <p>Meta: {moneda(equipo.totalAnual.meta)}</p>
              <p>Cumplimiento: {porcentaje(equipo.totalAnual.cumplimiento)}</p>
              <p>
                Brecha:{" "}
                {textoBrechaMonetaria(
                  equipo.totalAnual.cumplimiento,
                  equipo.totalAnual.brecha,
                )}
              </p>
            </>
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Desempeño por vendedor
        </h2>
        {equipo.filas.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay vendedores registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Vendedor</th>
                  <th className="px-3 py-2 font-medium">Ventas mes</th>
                  <th className="px-3 py-2 font-medium">Meta mes</th>
                  <th className="px-3 py-2 font-medium">% mes</th>
                  <th className="px-3 py-2 font-medium">Brecha mes</th>
                  <th className="px-3 py-2 font-medium">Ventas año</th>
                  <th className="px-3 py-2 font-medium">% año</th>
                  <th className="px-3 py-2 font-medium">Activ. mes</th>
                </tr>
              </thead>
              <tbody>
                {equipo.filas.map((f) => (
                  <tr key={f.vendedorId} className="border-b border-zinc-100">
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/vendedor/${f.vendedorId}${q}`}
                        className="text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {f.nombre}
                      </Link>
                      {f.activo ? null : (
                        <span className="ml-1 text-xs text-zinc-400">
                          (inactivo)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {moneda(f.mensual.realizado)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {moneda(f.mensual.meta)}
                    </td>
                    <td className="px-3 py-2">
                      {porcentaje(f.mensual.cumplimiento)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {f.mensual.brecha > 0
                        ? moneda(f.mensual.brecha)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {moneda(f.anual.realizado)}
                    </td>
                    <td className="px-3 py-2">
                      {porcentaje(f.anual.cumplimiento)}
                    </td>
                    <td className="px-3 py-2">{f.actividadesMes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Principales brechas del mes
        </h2>
        {brechas.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Sin brechas: todos alcanzan su meta mensual (o no tienen meta
            definida).
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {brechas.map((f) => (
              <li
                key={f.vendedorId}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm"
              >
                <span>{f.nombre}</span>
                <span className="text-zinc-600">
                  faltan {moneda(f.mensual.brecha)} ·{" "}
                  {porcentaje(f.mensual.cumplimiento)} de la meta
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
