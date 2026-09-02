/**
 * Crea (o actualiza) el primer usuario Administrador.
 *
 * No hay pantalla para esto: crear el primer admin requiere la clave
 * `service_role`, que solo vive en el servidor / en tu máquina.
 *
 * Uso:
 *   1. Rellena .env.local con NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_PASSWORD
 *   2. npm run seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nombre = process.env.ADMIN_NOMBRE?.trim() || "Administrador";
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;

function abortar(mensaje: string): never {
  console.error(`\n  ✗ ${mensaje}\n`);
  process.exit(1);
}

if (!url || !serviceKey) {
  abortar("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
}
if (!email || !password) {
  abortar("Falta ADMIN_EMAIL o ADMIN_PASSWORD en .env.local");
}
if (password.length < 8) {
  abortar("ADMIN_PASSWORD debe tener al menos 8 caracteres");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function buscarUsuario(correo: string) {
  // Recorre las páginas de usuarios hasta encontrar el correo.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const encontrado = data.users.find(
      (u) => u.email?.toLowerCase() === correo.toLowerCase(),
    );
    if (encontrado) return encontrado;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const existente = await buscarUsuario(email!);

  if (existente) {
    const { error: errAuth } = await supabase.auth.admin.updateUserById(existente.id, {
      password,
      user_metadata: { nombre, rol: "admin" },
    });
    if (errAuth) throw errAuth;

    const { error: errPerfil } = await supabase
      .from("profiles")
      .update({ nombre, rol: "admin", activo: true })
      .eq("id", existente.id);
    if (errPerfil) throw errPerfil;

    console.log(`\n  ✓ Administrador actualizado: ${email}\n`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol: "admin" },
  });
  if (error) throw error;

  // El trigger handle_new_user ya creó el profile; forzamos rol admin por si
  // los metadatos no se hubieran aplicado.
  const { error: errPerfil } = await supabase
    .from("profiles")
    .update({ nombre, rol: "admin", activo: true })
    .eq("id", data.user.id);
  if (errPerfil) throw errPerfil;

  console.log(`\n  ✓ Administrador creado: ${email}\n`);
}

main().catch((e) => {
  console.error("\n  ✗ Error al crear el administrador:");
  console.error(e);
  process.exit(1);
});
