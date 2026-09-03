import { requerirSesion } from "@/lib/auth";
import { EnConstruccion } from "@/components/EnConstruccion";

export default async function VentasPage() {
  await requerirSesion();
  return <EnConstruccion titulo="Registrar venta" modulo="Módulo 2" />;
}
