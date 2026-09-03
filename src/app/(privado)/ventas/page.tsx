import { requerirSesion } from "@/lib/auth";
import type { Venta } from "@/lib/db.types";
import { hoyISO } from "@/lib/periodos";
import { moneda, fecha as fmtFecha } from "@/lib/formato";
import { sumaMontos } from "@/lib/calculos";
import { FormNuevaVenta } from "./form-nueva";
import { actualizarVenta, borrarVenta } from "./actions";

export default async function VentasPage() {
  const { user, supabase } = await requerirSesion();

  const { data } = await supabase
    .from("ventas")
    .select("*")
    .eq("vendedor_id", user.id)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(200)
    .returns<Venta[]>();

  const ventas = data ?? [];
  const total = sumaMontos(ventas);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Registrar venta</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Anota cada resultado comercial cerrado.
        </p>
      </div>

      <FormNuevaVenta hoy={hoyISO()} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Mis ventas ({ventas.length})
          </h2>
          <span className="text-sm text-zinc-600">
            Total mostrado: <strong>{moneda(total)}</strong>
          </span>
        </div>

        {ventas.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no has registrado ninguna.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Monto</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Nota</th>
                  <th className="px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtFecha(v.fecha)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {moneda(v.monto)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{v.cliente ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{v.nota ?? "—"}</td>
                    <td className="px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-zinc-600 hover:text-zinc-900">
                          Editar
                        </summary>
                        <div className="mt-2 flex flex-col gap-3 rounded-md bg-zinc-50 p-2">
                          <form
                            action={actualizarVenta}
                            className="flex flex-col gap-2"
                          >
                            <input type="hidden" name="id" value={v.id} />
                            <label className="flex flex-col gap-1">
                              <span>Fecha</span>
                              <input
                                name="fecha"
                                type="date"
                                defaultValue={v.fecha}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Monto</span>
                              <input
                                name="monto"
                                type="number"
                                min={0}
                                step="0.01"
                                defaultValue={v.monto}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Cliente</span>
                              <input
                                name="cliente"
                                defaultValue={v.cliente ?? ""}
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Nota</span>
                              <input
                                name="nota"
                                defaultValue={v.nota ?? ""}
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

                          <form action={borrarVenta}>
                            <input type="hidden" name="id" value={v.id} />
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
