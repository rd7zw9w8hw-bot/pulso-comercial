"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearVendedor, type EstadoForm } from "./actions";

const INICIAL: EstadoForm = {};

export function FormNuevoVendedor() {
  const [estado, accion, pendiente] = useActionState(crearVendedor, INICIAL);
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
        <span className="font-medium">Nombre</span>
        <input
          name="nombre"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Correo electrónico</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Contraseña inicial</span>
        <input
          name="password"
          type="text"
          minLength={8}
          required
          placeholder="mínimo 8 caracteres"
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Rol</span>
        <select
          name="rol"
          defaultValue="vendedor"
          className="rounded-md border border-zinc-300 px-3 py-2"
        >
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
      </label>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pendiente ? "Creando…" : "Crear vendedor"}
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
