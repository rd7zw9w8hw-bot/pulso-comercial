import { requerirAdmin } from "@/lib/auth";
import type { Profile, MetaMensual, MetaAnual } from "@/lib/db.types";
import {
  NOMBRES_MES,
  aniosDisponibles,
  periodoActual,
} from "@/lib/periodos";
import { guardarMetas } from "./actions";

const CAMPOS_ACTIVIDAD = [
  { name: "meta_contactos", etiqueta: "Contactos / llamadas" },
  { name: "meta_reuniones", etiqueta: "Reuniones comerciales" },
  { name: "meta_oportunidades", etiqueta: "Oportunidades creadas" },
  { name: "meta_propuestas", etiqueta: "Propuestas enviadas" },
] as const;

export default async function MetasPage({
  searchParams,
}: PageProps<"/admin/metas">) {
  const { supabase } = await requerirAdmin();
  const sp = await searchParams;

  const hoy = periodoActual();
  const anios = aniosDisponibles(hoy.anio + 1);
  const vendedorSel = typeof sp.vendedor === "string" ? sp.vendedor : "";
  const anioSel = Number(sp.anio) || hoy.anio;
  const mesSel = Number(sp.mes) || hoy.mes;
  const guardado = sp.guardado === "1";

  const { data: vendedores } = await supabase
    .from("profiles")
    .select("*")
    .eq("rol", "vendedor")
    .order("nombre")
    .returns<Profile[]>();

  const listaVendedores = vendedores ?? [];

  let mensual: MetaMensual | null = null;
  let anual: MetaAnual | null = null;

  if (vendedorSel) {
    const { data: m } = await supabase
      .from("metas_mensuales")
      .select("*")
      .eq("vendedor_id", vendedorSel)
      .eq("anio", anioSel)
      .eq("mes", mesSel)
      .maybeSingle<MetaMensual>();
    mensual = m ?? null;

    const { data: a } = await supabase
      .from("metas_anuales")
      .select("*")
      .eq("vendedor_id", vendedorSel)
      .eq("anio", anioSel)
      .maybeSingle<MetaAnual>();
    anual = a ?? null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Metas</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Define las metas de ventas y de actividad por vendedor y período.
        </p>
      </div>

      {/* Selector de vendedor + período (recarga la página) */}
      <form
        method="get"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Vendedor</span>
          <select
            name="vendedor"
            defaultValue={vendedorSel}
            className="rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="">— Elige un vendedor —</option>
            {listaVendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
                {v.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Año</span>
          <select
            name="anio"
            defaultValue={anioSel}
            className="rounded-md border border-zinc-300 px-3 py-2"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Mes</span>
          <select
            name="mes"
            defaultValue={mesSel}
            className="rounded-md border border-zinc-300 px-3 py-2"
          >
            {NOMBRES_MES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
          >
            Ver metas
          </button>
        </div>
      </form>

      {!vendedorSel ? (
        <p className="text-sm text-zinc-500">
          Elige un vendedor para ver y editar sus metas.
        </p>
      ) : (
        <form
          action={guardarMetas}
          className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <input type="hidden" name="vendedor_id" value={vendedorSel} />
          <input type="hidden" name="anio" value={anioSel} />
          <input type="hidden" name="mes" value={mesSel} />

          <p className="text-sm text-zinc-600">
            {listaVendedores.find((v) => v.id === vendedorSel)?.nombre} ·{" "}
            {NOMBRES_MES[mesSel - 1]} {anioSel}
          </p>

          {guardado ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              Metas guardadas.
            </p>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2">
            <h2 className="sm:col-span-2 text-sm font-semibold text-zinc-700">
              Metas monetarias
            </h2>
            <label className="flex flex-col gap-1 text-sm">
              <span>Meta de ventas del mes</span>
              <input
                name="meta_ventas"
                type="number"
                min={0}
                step="0.01"
                defaultValue={mensual?.meta_ventas ?? 0}
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Meta de ventas del año</span>
              <input
                name="meta_ventas_anual"
                type="number"
                min={0}
                step="0.01"
                defaultValue={anual?.meta_ventas_anual ?? 0}
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <h2 className="sm:col-span-2 text-sm font-semibold text-zinc-700">
              Metas mensuales de actividad
            </h2>
            {CAMPOS_ACTIVIDAD.map((c) => (
              <label key={c.name} className="flex flex-col gap-1 text-sm">
                <span>{c.etiqueta}</span>
                <input
                  name={c.name}
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={
                    (mensual?.[c.name as keyof MetaMensual] as number) ?? 0
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2"
                />
              </label>
            ))}
          </section>

          <button
            type="submit"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Guardar metas
          </button>
        </form>
      )}
    </div>
  );
}
