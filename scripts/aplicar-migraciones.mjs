/**
 * Aplica los archivos SQL de supabase/migrations/ en orden alfabético,
 * conectándose directamente a Postgres.
 *
 * Uso:
 *   node scripts/aplicar-migraciones.mjs "postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:5432/postgres"
 *
 * O define DATABASE_URL en el entorno / .env.local y ejecuta sin argumentos.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dirMigraciones = join(__dirname, "..", "supabase", "migrations");

const connectionString = process.argv[2] || process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "\n  ✗ Falta la cadena de conexión.\n" +
      '    node scripts/aplicar-migraciones.mjs "postgresql://..."\n',
  );
  process.exit(1);
}

const archivos = readdirSync(dirMigraciones)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (archivos.length === 0) {
  console.error("  ✗ No hay archivos .sql en supabase/migrations/");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log(`\n  Conectado. Aplicando ${archivos.length} migración(es):\n`);

  for (const archivo of archivos) {
    const sql = readFileSync(join(dirMigraciones, archivo), "utf8");
    process.stdout.write(`  - ${archivo} ... `);
    await client.query(sql);
    console.log("ok");
  }

  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' order by table_name`,
  );
  console.log(
    `\n  Tablas en public: ${rows.map((r) => r.table_name).join(", ")}\n`,
  );
}

main()
  .catch((e) => {
    console.error("\n  ✗ Error aplicando migraciones:\n", e.message ?? e, "\n");
    process.exitCode = 1;
  })
  .finally(() => client.end());
