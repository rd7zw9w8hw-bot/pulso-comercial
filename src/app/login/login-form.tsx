"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(
    iniciarSesion,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Correo electrónico</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
        />
      </label>

      {estado.error ? (
        <p className="text-sm text-red-600">{estado.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
