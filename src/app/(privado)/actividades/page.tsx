import { requerirSesion } from "@/lib/auth";
import { EnConstruccion } from "@/components/EnConstruccion";

export default async function ActividadesPage() {
  await requerirSesion();
  return <EnConstruccion titulo="Registrar actividad" modulo="Módulo 2" />;
}
