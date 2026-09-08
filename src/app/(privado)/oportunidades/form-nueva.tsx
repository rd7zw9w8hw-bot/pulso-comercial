"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearOportunidad, type EstadoForm } from "./actions";

const INICIAL: EstadoForm = {};

export function FormNuevaOportunidad({ fechaDefecto }: { fechaDefecto: string }) {
  const [estado, accion, pendiente] = useActionState(crearOportunidad, INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  return (
    <form
      ref={formRef}
      action={accion}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Cliente</span>
        <input
          name="cliente"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Monto estimado</span>
        <input
          name="monto_estimado"
          type="number"
          min={0}
          step="0.01"
          defaultValue={0}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha de creación</span>
        <input
          name="fecha_creacion"
          type="date"
          defaultValue={fechaDefecto}
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Descripción (opcional)</span>
        <input
          name="descripcion"
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">Nota (opcional)</span>
        <textarea
          name="nota"
          rows={2}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Crear oportunidad"}
        </button>
        {estado.error ? (
          <span className="text-sm text-red-600">{estado.error}</span>
        ) : null}
        {estado.ok ? (
          <span className="text-sm text-green-700">{estado.ok}</span>
        ) : null}
      </div>
    </form>
  );
}
