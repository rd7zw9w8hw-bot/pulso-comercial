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
import { moneda } from "@/lib/formato";

export type DatoVendedor = {
  nombre: string;
  realizado: number;
  meta: number;
};

export function GraficoBarrasVendedores({ datos }: { datos: DatoVendedor[] }) {
  if (datos.length === 0) return null;

  const alto = Math.max(160, datos.length * 56 + 40);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div style={{ width: "100%", height: alto }}>
        <ResponsiveContainer>
          <BarChart
            data={datos}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#e4e4e7" />
            <XAxis
              type="number"
              tickFormatter={(v) => moneda(Number(v))}
              tick={{ fontSize: 11, fill: "#71717a" }}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={110}
              tick={{ fontSize: 12, fill: "#3f3f46" }}
            />
            <Tooltip
              formatter={(v) => moneda(Number(v))}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="realizado" name="Ventas" fill="#3f3f46" radius={2} />
            <Bar dataKey="meta" name="Meta" fill="#d4d4d8" radius={2} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
