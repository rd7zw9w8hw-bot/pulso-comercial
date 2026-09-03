import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";

export default async function Inicio() {
  const { perfil } = await requerirSesion();
  redirect(perfil.rol === "admin" ? "/dashboard" : "/mi-desempeno");
}
