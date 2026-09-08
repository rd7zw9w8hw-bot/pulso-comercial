import type { DesempenoVendedor } from "@/lib/calculos";
import {
  moneda,
  porcentaje,
  textoBrechaMonetaria,
  textoBrechaActividad,
} from "@/lib/formato";
import { etiquetaPeriodo, type Periodo } from "@/lib/periodos";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { BarraProgreso } from "@/components/BarraProgreso";
import { GraficoActividad } from "@/components/GraficoActividad";

export function VistaDesempenoVendedor({
  desempeno,
  periodo,
  anios,
}: {
  desempeno: DesempenoVendedor;
  periodo: Periodo;
  anios: number[];
}) {
  const { mensual, anual, actividades, oportunidades } = desempeno;

  return (
    <div className="flex flex-col gap-6">
      <SelectorPeriodo anio={periodo.anio} mes={periodo.mes} anios={anios} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Ventas · {etiquetaPeriodo(periodo)}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TarjetaIndicador
            etiqueta="Ventas del mes"
            valor={moneda(mensual.realizado)}
            detalle={
              <>
                <p>Meta: {moneda(mensual.meta)}</p>
                <BarraProgreso cumplimiento={mensual.cumplimiento} />
                <p>
                  Brecha:{" "}
                  {textoBrechaMonetaria(mensual.cumplimiento, mensual.brecha)}
                </p>
              </>
            }
          />
          <TarjetaIndicador
            etiqueta={`Ventas del año ${periodo.anio}`}
            valor={moneda(anual.realizado)}
            detalle={
              <>
                <p>Meta: {moneda(anual.meta)}</p>
                <BarraProgreso cumplimiento={anual.cumplimiento} />
                <p>Brecha: {textoBrechaMonetaria(anual.cumplimiento, anual.brecha)}</p>
              </>
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Oportunidades · {etiquetaPeriodo(periodo)}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaIndicador
            etiqueta="Pipeline abierto (actual)"
            valor={oportunidades.abiertas}
            detalle={<p>Valor: {moneda(oportunidades.valorPipeline)}</p>}
          />
          <TarjetaIndicador
            etiqueta="Creadas en el mes"
            valor={oportunidades.creadasMes}
            detalle={
              <>
                <p>Meta: {oportunidades.metaCreadas}</p>
                <BarraProgreso cumplimiento={oportunidades.cumplimientoCreadas} />
              </>
            }
          />
          <TarjetaIndicador
            etiqueta="Ganadas / perdidas del mes"
            valor={`${oportunidades.ganadasMes} / ${oportunidades.perdidasMes}`}
            detalle={<p>Valor ganado: {moneda(oportunidades.valorGanadoMes)}</p>}
          />
          <TarjetaIndicador
            etiqueta="Conversión del mes"
            valor={porcentaje(oportunidades.tasaConversionMes)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Actividad del mes · {etiquetaPeriodo(periodo)}
        </h2>

        <GraficoActividad
          datos={actividades.map((a) => ({
            etiqueta: a.etiquetaCorta,
            realizado: a.realizado,
            meta: a.meta,
          }))}
        />

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Actividad</th>
                <th className="px-4 py-2 font-medium">Realizado</th>
                <th className="px-4 py-2 font-medium">Meta</th>
                <th className="px-4 py-2 font-medium">Cumplimiento</th>
                <th className="px-4 py-2 font-medium">Brecha</th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((a) => (
                <tr key={a.tipo} className="border-b border-zinc-100">
                  <td className="px-4 py-2">{a.etiqueta}</td>
                  <td className="px-4 py-2">{a.realizado}</td>
                  <td className="px-4 py-2">{a.meta}</td>
                  <td className="px-4 py-2">{porcentaje(a.cumplimiento)}</td>
                  <td className="px-4 py-2">
                    {textoBrechaActividad(a.cumplimiento, a.brecha)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
