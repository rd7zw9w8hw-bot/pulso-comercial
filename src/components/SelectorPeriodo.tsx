"use client";

import { useRouter, usePathname } from "next/navigation";
import { NOMBRES_MES } from "@/lib/periodos";

export function SelectorPeriodo({
  anio,
  mes,
  anios,
}: {
  anio: number;
  mes: number;
  anios: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const ir = (a: number, m: number) =>
    router.push(`${pathname}?anio=${a}&mes=${m}`);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-zinc-500">Período:</span>
      <select
        value={mes}
        onChange={(e) => ir(anio, Number(e.target.value))}
        className="rounded-md border border-zinc-300 px-2 py-1"
      >
        {NOMBRES_MES.map((nombre, i) => (
          <option key={nombre} value={i + 1}>
            {nombre}
          </option>
        ))}
      </select>
      <select
        value={anio}
        onChange={(e) => ir(Number(e.target.value), mes)}
        className="rounded-md border border-zinc-300 px-2 py-1"
      >
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
