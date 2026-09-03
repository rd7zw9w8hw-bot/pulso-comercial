import { requerirSesion } from "@/lib/auth";
import type { Actividad } from "@/lib/db.types";
import { TIPOS_ACTIVIDAD } from "@/lib/constantes";
import { hoyISO } from "@/lib/periodos";
import { fecha as fmtFecha } from "@/lib/formato";
import { FormNuevaActividad } from "./form-nueva";
import { actualizarActividad, borrarActividad } from "./actions";

const ETIQUETA_TIPO = Object.fromEntries(
  TIPOS_ACTIVIDAD.map((t) => [t.valor, t.etiqueta]),
);

export default async function ActividadesPage() {
  const { user, supabase } = await requerirSesion();

  const { data } = await supabase
    .from("actividades")
    .select("*")
    .eq("vendedor_id", user.id)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(200)
    .returns<Actividad[]>();

  const actividades = data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Registrar actividad</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Anota tus contactos, reuniones, oportunidades y propuestas.
        </p>
      </div>

      <FormNuevaActividad hoy={hoyISO()} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Mis actividades ({actividades.length})
        </h2>

        {actividades.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no has registrado ninguna.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Nota</th>
                  <th className="px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtFecha(a.fecha)}
                    </td>
                    <td className="px-4 py-3">{ETIQUETA_TIPO[a.tipo] ?? a.tipo}</td>
                    <td className="px-4 py-3 text-zinc-600">{a.nota ?? "—"}</td>
                    <td className="px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-zinc-600 hover:text-zinc-900">
                          Editar
                        </summary>
                        <div className="mt-2 flex flex-col gap-3 rounded-md bg-zinc-50 p-2">
                          <form
                            action={actualizarActividad}
                            className="flex flex-col gap-2"
                          >
                            <input type="hidden" name="id" value={a.id} />
                            <label className="flex flex-col gap-1">
                              <span>Tipo</span>
                              <select
                                name="tipo"
                                defaultValue={a.tipo}
                                className="rounded border border-zinc-300 px-2 py-1"
                              >
                                {TIPOS_ACTIVIDAD.map((t) => (
                                  <option key={t.valor} value={t.valor}>
                                    {t.etiqueta}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Fecha</span>
                              <input
                                name="fecha"
                                type="date"
                                defaultValue={a.fecha}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Nota</span>
                              <input
                                name="nota"
                                defaultValue={a.nota ?? ""}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <button
                              type="submit"
                              className="self-start rounded-md bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
                            >
                              Guardar
                            </button>
                          </form>

                          <form action={borrarActividad}>
                            <input type="hidden" name="id" value={a.id} />
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
