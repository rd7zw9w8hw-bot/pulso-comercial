import { requerirSesion } from "@/lib/auth";
import { EnConstruccion } from "@/components/EnConstruccion";

export default async function MiDesempenoPage() {
  await requerirSesion();
  return <EnConstruccion titulo="Mi desempeño" modulo="Módulo 3" />;
}
