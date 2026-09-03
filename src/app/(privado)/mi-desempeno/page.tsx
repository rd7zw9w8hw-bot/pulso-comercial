import { requerirSesion } from "@/lib/auth";
import {
  parsearPeriodo,
  aniosDisponibles,
  periodoActual,
} from "@/lib/periodos";
import { cargarDesempenoVendedor } from "@/lib/desempeno";
import { VistaDesempenoVendedor } from "@/components/VistaDesempenoVendedor";

export default async function MiDesempenoPage({
  searchParams,
}: PageProps<"/mi-desempeno">) {
  const { user, supabase } = await requerirSesion();
  const sp = await searchParams;

  const periodo = parsearPeriodo({
    anio: typeof sp.anio === "string" ? sp.anio : null,
    mes: typeof sp.mes === "string" ? sp.mes : null,
  });
  const anios = aniosDisponibles(periodoActual().anio + 1);

  const desempeno = await cargarDesempenoVendedor(supabase, user.id, periodo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mi desempeño</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tus ventas y tu actividad frente a las metas del período.
        </p>
      </div>

      <VistaDesempenoVendedor
        desempeno={desempeno}
        periodo={periodo}
        anios={anios}
      />
    </div>
  );
}
