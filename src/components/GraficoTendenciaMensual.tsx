"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { NOMBRES_MES } from "@/lib/periodos";
import { moneda } from "@/lib/formato";

export type DatoTendencia = {
  mes: number;
  ventas: number;
  metaMensual: number;
};

export function GraficoTendenciaMensual({ datos }: { datos: DatoTendencia[] }) {
  const data = datos.map((d) => ({
    nombre: NOMBRES_MES[d.mes - 1].slice(0, 3),
    ventas: d.ventas,
    metaMensual: d.metaMensual,
  }));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 11, fill: "#3f3f46" }}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => moneda(Number(v))}
              tick={{ fontSize: 10, fill: "#71717a" }}
              width={90}
            />
            <Tooltip
              formatter={(v) => moneda(Number(v))}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="ventas"
              name="Ventas del mes"
              fill="#3f3f46"
              radius={2}
            />
            <Line
              dataKey="metaMensual"
              name="Meta del mes"
              stroke="#a1a1aa"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
