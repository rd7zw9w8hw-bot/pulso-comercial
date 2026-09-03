import type { ReactNode } from "react";

export function TarjetaIndicador({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {etiqueta}
      </p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {detalle ? (
        <div className="mt-2 space-y-0.5 text-sm text-zinc-600">{detalle}</div>
      ) : null}
    </div>
  );
}
