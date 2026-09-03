import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/auth";
import {
  parsearPeriodo,
  aniosDisponibles,
  periodoActual,
} from "@/lib/periodos";
import { cargarDesempenoVendedor } from "@/lib/desempeno";
import { VistaDesempenoVendedor } from "@/components/VistaDesempenoVendedor";

export default async function DetalleVendedorPage({
  params,
  searchParams,
}: PageProps<"/dashboard/vendedor/[id]">) {
  const { supabase } = await requerirAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const periodo = parsearPeriodo({
    anio: typeof sp.anio === "string" ? sp.anio : null,
    mes: typeof sp.mes === "string" ? sp.mes : null,
  });
  const anios = aniosDisponibles(periodoActual().anio + 1);

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, activo")
    .eq("id", id)
    .maybeSingle<{ nombre: string; activo: boolean }>();

  if (!perfil) notFound();

  const desempeno = await cargarDesempenoVendedor(supabase, id, periodo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard?anio=${periodo.anio}&mes=${periodo.mes}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {perfil.nombre}
          {perfil.activo ? null : (
            <span className="ml-2 text-sm font-normal text-zinc-400">
              (inactivo)
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">Desempeño individual.</p>
      </div>

      <VistaDesempenoVendedor
        desempeno={desempeno}
        periodo={periodo}
        anios={anios}
      />
    </div>
  );
}
