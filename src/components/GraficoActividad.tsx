"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type DatoActividad = {
  etiqueta: string;
  realizado: number;
  meta: number;
};

export function GraficoActividad({ datos }: { datos: DatoActividad[] }) {
  if (datos.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart
            data={datos}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 11, fill: "#3f3f46" }}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#71717a" }}
            />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="realizado" name="Realizado" fill="#3f3f46" radius={2} />
            <Bar dataKey="meta" name="Meta" fill="#d4d4d8" radius={2} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
