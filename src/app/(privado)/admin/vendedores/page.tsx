import { requerirAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/db.types";
import { FormNuevoVendedor } from "./form-nuevo";
import { actualizarVendedor, alternarActivo } from "./actions";

export default async function VendedoresPage() {
  const { perfil, supabase } = await requerirAdmin();

  const { data: personas } = await supabase
    .from("profiles")
    .select("*")
    .order("creado_en", { ascending: true })
    .returns<Profile[]>();

  const lista = personas ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Vendedores</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Crea usuarios, cambia su rol y actívalos o desactívalos.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">Nuevo usuario</h2>
        <FormNuevoVendedor />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Usuarios ({lista.length})
        </h2>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Correo</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const esYoMismo = p.id === perfil.id;
                return (
                  <tr key={p.id} className="border-b border-zinc-100 align-top">
                    <td className="px-4 py-3">
                      {p.nombre}
                      {esYoMismo ? (
                        <span className="ml-1 text-xs text-zinc-400">(tú)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{p.email}</td>
                    <td className="px-4 py-3">
                      {p.rol === "admin" ? "Administrador" : "Vendedor"}
                    </td>
                    <td className="px-4 py-3">
                      {p.activo ? (
                        <span className="text-green-700">Activo</span>
                      ) : (
                        <span className="text-zinc-400">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {!esYoMismo ? (
                          <form action={alternarActivo}>
                            <input type="hidden" name="id" value={p.id} />
                            <input
                              type="hidden"
                              name="activar"
                              value={p.activo ? "0" : "1"}
                            />
                            <button
                              type="submit"
                              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100"
                            >
                              {p.activo ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        ) : null}

                        <details className="text-xs">
                          <summary className="cursor-pointer text-zinc-600 hover:text-zinc-900">
                            Editar
                          </summary>
                          <form
                            action={actualizarVendedor}
                            className="mt-2 flex flex-col gap-2 rounded-md bg-zinc-50 p-2"
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <label className="flex flex-col gap-1">
                              <span>Nombre</span>
                              <input
                                name="nombre"
                                defaultValue={p.nombre}
                                required
                                className="rounded border border-zinc-300 px-2 py-1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Rol</span>
                              <select
                                name="rol"
                                defaultValue={p.rol}
                                disabled={esYoMismo}
                                className="rounded border border-zinc-300 px-2 py-1 disabled:bg-zinc-100"
                              >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Administrador</option>
                              </select>
                            </label>
                            <button
                              type="submit"
                              className="self-start rounded-md bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
                            >
                              Guardar
                            </button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
