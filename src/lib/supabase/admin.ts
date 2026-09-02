import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave `service_role`. SALTA las políticas RLS.
 *
 * Uso EXCLUSIVO en el servidor (Server Actions / Route Handlers) para tareas de
 * administración: crear usuarios de autenticación, etc.
 *
 * La clave `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al cliente ni
 * colocarse en una variable `NEXT_PUBLIC_`.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
