import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import type { Oportunidad, Venta } from "@/lib/db.types";
import {
  ESTADOS_OPORTUNIDAD,
  VALORES_ESTADO_OPORTUNIDAD,
  type EstadoOportunidad,
} from "@/lib/constantes";
import {
  parsearPeriodo,
  aniosDisponibles,
  periodoActual,
  etiquetaPeriodo,
  rangoMes,
  hoyISO,
} from "@/lib/periodos";
import { resumenOportunidades } from "@/lib/calculos";
import {
  moneda,
  porcentaje,
  fecha as fmtFecha,
  textoBrechaActividad,
} from "@/lib/formato";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { BarraProgreso } from "@/components/BarraProgreso";
import { FormNuevaOportunidad } from "./form-nueva";
import {
  actualizarOportunidad,
  cambiarEstado,
  reabrirOportunidad,
  borrarOportunidad,
} from "./actions";

const ETIQUETA_ESTADO: Record<string, string> = Object.fromEntries(
  ESTADOS_OPORTUNIDAD.map((e) => [e.valor, e.etiqueta]),
);

type VentaLigera = Pick<Venta, "id" | "fecha" | "monto" | "cliente">;

export default async function OportunidadesPage({
  searchParams,
}: PageProps<"/oportunidades">) {
  const { user, supabase } = await requerirSesion();
  const sp = await searchParams;

  const hoy = periodoActual();
  const periodo = parsearPeriodo({
    anio: typeof sp.anio === "string" ? sp.anio : null,
    mes: typeof sp.mes === "string" ? sp.mes : null,
  });
  const anios = aniosDisponibles(hoy.anio + 1);
  const rango = rangoMes(periodo);
  const esPeriodoActual = periodo.anio === hoy.anio && periodo.mes === hoy.mes;
  const fechaDefecto = esPeriodoActual ? hoyISO() : rango.hasta;

  const filtroEstado =
    typeof sp.estado === "string" &&
    VALORES_ESTADO_OPORTUNIDAD.includes(sp.estado as EstadoOportunidad)
      ? (sp.estado as EstadoOportunidad)
      : null;

  const [oportunidadesRes, metaRes, ventasRes] = await Promise.all([
    supabase
      .from("oportunidades")
      .select("*")
      .eq("vendedor_id", user.id)
      .order("fecha_creacion", { ascending: false })
      .order("id", { ascending: false })
      .returns<Oportunidad[]>(),
    supabase
      .from("metas_mensuales")
      .select("meta_oportunidades")
      .eq("vendedor_id", user.id)
      .eq("anio", periodo.anio)
      .eq("mes", periodo.mes)
      .maybeSingle<{ meta_oportunidades: number }>(),
    supabase
      .from("ventas")
      .select("id, fecha, monto, cliente")
      .eq("vendedor_id", user.id)
      .order("fecha", { ascending: false })
      .limit(50)
      .returns<VentaLigera[]>(),
  ]);

  const todas = oportunidadesRes.data ?? [];
  const metaOportunidades = metaRes.data?.meta_oportunidades ?? 0;
  const resumen = resumenOportunidades(todas, rango, metaOportunidades);

  const idsEnlazados = new Set(
    todas.map((o) => o.venta_id).filter((v): v is number => v != null),
  );
  const ventasDisponibles = (ventasRes.data ?? []).filter(
    (v) => !idsEnlazados.has(v.id),
  );

  const lista = filtroEstado
    ? todas.filter((o) => o.estado === filtroEstado)
    : todas;

  const q = `?anio=${periodo.anio}&mes=${periodo.mes}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Oportunidades</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestiona tu pipeline: abre oportunidades y márcalas como ganadas o
          perdidas.
        </p>
      </div>

      <SelectorPeriodo anio={periodo.anio} mes={periodo.mes} anios={anios} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaIndicador
          etiqueta="Pipeline abierto (actual)"
          valor={resumen.abiertas}
          detalle={<p>Valor estimado: {moneda(resumen.valorPipeline)}</p>}
        />
        <TarjetaIndicador
          etiqueta={`Creadas en ${etiquetaPeriodo(periodo)}`}
          valor={resumen.creadasMes}
          detalle={
            <>
              <p>Meta: {resumen.metaCreadas}</p>
              <BarraProgreso cumplimiento={resumen.cumplimientoCreadas} />
              <p>
                {textoBrechaActividad(
                  resumen.cumplimientoCreadas,
                  resumen.brechaCreadas,
                )}
              </p>
            </>
          }
        />
        <TarjetaIndicador
          etiqueta="Ganadas / perdidas del mes"
          valor={`${resumen.ganadasMes} / ${resumen.perdidasMes}`}
          detalle={<p>Valor ganado: {moneda(resumen.valorGanadoMes)}</p>}
        />
        <TarjetaIndicador
          etiqueta="Tasa de conversión del mes"
          valor={porcentaje(resumen.tasaConversionMes)}
          detalle={<p>ganadas ÷ (ganadas + perdidas)</p>}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">Nueva oportunidad</h2>
        <FormNuevaOportunidad fechaDefecto={fechaDefecto} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-700">
            Mis oportunidades ({lista.length})
          </h2>
          <span className="text-zinc-300">·</span>
          <Link
            href={`/oportunidades${q}`}
            className={`rounded-md px-2 py-0.5 text-xs ${
              filtroEstado === null
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Todas
          </Link>
          {ESTADOS_OPORTUNIDAD.map((e) => (
            <Link
              key={e.valor}
              href={`/oportunidades${q}&estado=${e.valor}`}
              className={`rounded-md px-2 py-0.5 text-xs ${
                filtroEstado === e.valor
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {e.etiqueta}
            </Link>
          ))}
        </div>

        {lista.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay oportunidades.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Monto estimado</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Creada</th>
                  <th className="px-4 py-2 font-medium">Cierre</th>
                  <th className="px-4 py-2 font-medium">Gestionar</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 align-top">
                    <td className="px-4 py-3">
                      {o.cliente}
                      {o.descripcion ? (
                        <span className="block text-xs text-zinc-500">
                          {o.descripcion}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {moneda(o.monto_estimado)}
                    </td>
                    <td className="px-4 py-3">
                      {ETIQUETA_ESTADO[o.estado] ?? o.estado}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtFecha(o.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                      {o.fecha_cierre ? fmtFecha(o.fecha_cierre) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-zinc-600 hover:text-zinc-900">
                          Gestionar
                        </summary>
                        <div className="mt-2 flex flex-col gap-3 rounded-md bg-zinc-50 p-2">
                          {o.estado === "abierta" ? (
                            <>
                              <form
                                action={cambiarEstado}
                                className="flex flex-col gap-2 rounded border border-green-200 p-2"
                              >
                                <input type="hidden" name="id" value={o.id} />
                                <input
                                  type="hidden"
                                  name="estado"
                                  value="ganada"
                                />
                                <span className="font-medium text-green-800">
                                  Marcar ganada
                                </span>
                                <label className="flex flex-col gap-1">
                                  <span>Fecha de cierre</span>
                                  <input
                                    name="fecha_cierre"
                                    type="date"
                                    defaultValue={hoyISO()}
                                    className="rounded border border-zinc-300 px-2 py-1"
                                  />
                                </label>
                                <label className="flex flex-col gap-1">
                                  <span>Enlazar venta (opcional)</span>
                                  <select
                                    name="venta_id"
                                    defaultValue=""
                                    className="rounded border border-zinc-300 px-2 py-1"
                                  >
                                    <option value="">— ninguna —</option>
                                    {ventasDisponibles.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {moneda(v.monto)} ·{" "}
                                        {v.cliente ?? "sin cliente"} ·{" "}
                                        {fmtFecha(v.fecha)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="flex flex-col gap-1">
                                  <span>o crea la venta con este monto</span>
                                  <input
                                    name="monto_venta"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0"
                                    className="rounded border border-zinc-300 px-2 py-1"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="self-start rounded-md bg-green-700 px-3 py-1 text-white hover:bg-green-800"
                                >
                                  Marcar ganada
                                </button>
                              </form>

                              <form
                                action={cambiarEstado}
                                className="flex flex-col gap-2 rounded border border-zinc-200 p-2"
                              >
                                <input type="hidden" name="id" value={o.id} />
                                <input
                                  type="hidden"
                                  name="estado"
                                  value="perdida"
                                />
                                <span className="font-medium">
                                  Marcar perdida
                                </span>
                                <label className="flex flex-col gap-1">
                                  <span>Fecha de cierre</span>
                                  <input
                                    name="fecha_cierre"
                                    type="date"
                                    defaultValue={hoyISO()}
                                    className="rounded border border-zinc-300 px-2 py-1"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="self-start rounded-md border border-zinc-400 px-3 py-1 hover:bg-zinc-100"
                                >
                                  Marcar perdida
                                </button>
                              </form>
                            </>
                          ) : (
                            <form action={reabrirOportunidad}>
                              <input type="hidden" name="id" value={o.id} />
                              <button
                                type="submit"
                                className="rounded-md border border-zinc-400 px-3 py-1 hover:bg-zinc-100"
                              >
                                Reabrir
                              </button>
                            </form>
                          )}

                          <form
                            action={actualizarOportunidad}
                            className="flex flex-col gap-2 border-t border-zinc-200 pt-2"
                          >
                            <input type="hidden" name="id" value={o.id} />
                            <label className="flex flex-col gap-1">
                              <span>Cliente</span>
                              <input
                                name="cliente"
                                defaultValue={o.cliente}
                                required
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Monto estimado</span>
                              <input
                                name="monto_estimado"
                                type="number"
                                min={0}
                                step="0.01"
                                defaultValue={o.monto_estimado}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Fecha de creación</span>
                              <input
                                name="fecha_creacion"
                                type="date"
                                defaultValue={o.fecha_creacion}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Descripción</span>
                              <input
                                name="descripcion"
                                defaultValue={o.descripcion ?? ""}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Nota</span>
                              <input
                                name="nota"
                                defaultValue={o.nota ?? ""}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <button
                              type="submit"
                              className="self-start rounded-md bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
                            >
                              Guardar cambios
                            </button>
                          </form>

                          <form action={borrarOportunidad}>
                            <input type="hidden" name="id" value={o.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                            >
                              Borrar
                            </button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
