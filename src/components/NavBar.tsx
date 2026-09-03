import Link from "next/link";
import type { Rol } from "@/lib/db.types";

type Enlace = {
  href: string;
  texto: string;
  roles: Rol[];
};

const ENLACES: Enlace[] = [
  { href: "/dashboard", texto: "Dashboard", roles: ["admin"] },
  { href: "/mi-desempeno", texto: "Mi desempeño", roles: ["vendedor"] },
  { href: "/actividades", texto: "Registrar actividad", roles: ["vendedor"] },
  { href: "/ventas", texto: "Registrar venta", roles: ["vendedor"] },
  { href: "/admin/vendedores", texto: "Vendedores", roles: ["admin"] },
  { href: "/admin/metas", texto: "Metas", roles: ["admin"] },
];

export function NavBar({ nombre, rol }: { nombre: string; rol: Rol }) {
  const enlaces = ENLACES.filter((e) => e.roles.includes(rol));

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3 text-sm">
        <span className="font-semibold">Pulso Comercial</span>

        {enlaces.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="text-zinc-600 hover:text-zinc-900"
          >
            {e.texto}
          </Link>
        ))}

        <span className="ml-auto text-zinc-500">
          {nombre} · {rol === "admin" ? "Administrador" : "Vendedor"}
        </span>
        <form action="/logout" method="post">
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-zinc-700 hover:bg-zinc-100"
          >
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
