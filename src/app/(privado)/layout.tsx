import type { ReactNode } from "react";
import { requerirSesion } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function LayoutPrivado({
  children,
}: {
  children: ReactNode;
}) {
  const { perfil } = await requerirSesion();

  return (
    <div className="min-h-screen">
      <NavBar nombre={perfil.nombre} rol={perfil.rol} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
