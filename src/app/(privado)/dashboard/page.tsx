import { requerirAdmin } from "@/lib/auth";
import { EnConstruccion } from "@/components/EnConstruccion";

export default async function DashboardPage() {
  await requerirAdmin();
  return <EnConstruccion titulo="Dashboard del equipo" modulo="Módulo 3" />;
}
