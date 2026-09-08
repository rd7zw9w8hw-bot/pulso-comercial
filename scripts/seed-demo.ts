/**
 * Datos de demostración para Pulso Comercial.
 *
 * Crea 4 vendedores con una "historia" distinta (en meta, por debajo, top,
 * y bajo desempeño con baja actividad) y genera sus metas, ventas y actividades
 * de enero a septiembre de 2026.
 *
 * Es repetible: borra los datos de esos 4 vendedores y los regenera. No toca
 * al usuario Administrador ni a otros usuarios.
 *
 * Uso:  npm run seed:demo
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("\n  ✗ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local\n");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Utilidades deterministas -------------------------------------------------

function mulberry32(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260908);
const randInt = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const jitter = (base: number, pct: number) => base * (1 + (rnd() * 2 - 1) * pct);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

// --- Parámetros de la demo ---------------------------------------------------

const PASSWORD = "DemoPulso2026";
const ANIO = 2026;
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const META_ACT = { contactos: 15, reuniones: 8, oportunidades: 5, propuestas: 3 };

const VENDEDORES = [
  { nombre: "Ana Vendedora", email: "ana.vendedora@ejemplo.com", metaVenta: 45000, ratioVenta: 1.0, ratioActividad: 1.0 },
  { nombre: "Beto Salas", email: "beto.salas@ejemplo.com", metaVenta: 40000, ratioVenta: 0.7, ratioActividad: 0.85 },
  { nombre: "Carla Ruiz", email: "carla.ruiz@ejemplo.com", metaVenta: 38000, ratioVenta: 1.22, ratioActividad: 1.1 },
  { nombre: "Diego Peña", email: "diego.pena@ejemplo.com", metaVenta: 42000, ratioVenta: 0.42, ratioActividad: 0.45 },
] as const;

const CLIENTES = [
  "Comercializadora del Istmo", "Distribuidora Central", "Grupo Pacífico",
  "Inversiones Delta", "Corporación Andes", "Almacenes Río", "Servicios Zeta",
  "Industrias Norte", "Mayorista Sur", "Textiles Aurora",
] as const;

const NOTAS_ACT = ["", "", "", "", "Seguimiento pendiente", "Cliente interesado", "Reagendar visita"] as const;

const TIPOS = [
  ["contacto", META_ACT.contactos],
  ["reunion", META_ACT.reuniones],
  ["oportunidad", META_ACT.oportunidades],
  ["propuesta", META_ACT.propuestas],
] as const;

// --- Tipos de fila ---------------------------------------------------------

type FilaMetaMensual = {
  vendedor_id: string; anio: number; mes: number; meta_ventas: number;
  meta_contactos: number; meta_reuniones: number;
  meta_oportunidades: number; meta_propuestas: number;
};
type FilaMetaAnual = { vendedor_id: string; anio: number; meta_ventas_anual: number };
type FilaVenta = { vendedor_id: string; fecha: string; monto: number; cliente: string; nota: null };
type FilaActividad = {
  vendedor_id: string;
  tipo: (typeof TIPOS)[number][0];
  fecha: string;
  nota: string | null;
};

const fechaEnMes = (mes: number) =>
  `${ANIO}-${String(mes).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;

function repartirMonto(total: number, n: number): number[] {
  const pesos = Array.from({ length: n }, () => 0.5 + rnd());
  const suma = pesos.reduce((a, b) => a + b, 0);
  return pesos.map((p) => Math.max(500, Math.round((p / suma) * total * 100) / 100));
}

async function buscarUsuario(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

async function asegurarVendedor(v: (typeof VENDEDORES)[number]): Promise<string> {
  let usuario = await buscarUsuario(v.email);
  if (!usuario) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: v.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nombre: v.nombre, rol: "vendedor" },
    });
    if (error) throw error;
    usuario = data.user;
    console.log(`  + creado ${v.email}`);
  }
  await supabase
    .from("profiles")
    .update({ nombre: v.nombre, rol: "vendedor", activo: true })
    .eq("id", usuario.id);
  return usuario.id;
}

async function insertarEnLotes<T>(tabla: string, filas: T[]) {
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500) as unknown[];
    const { error } = await supabase.from(tabla).insert(lote as never);
    if (error) throw error;
  }
  console.log(`  ${tabla}: ${filas.length} filas`);
}

async function main() {
  console.log("\nSembrando datos de demo...\n");

  const ids: Record<string, string> = {};
  for (const v of VENDEDORES) ids[v.email] = await asegurarVendedor(v);
  const idList = Object.values(ids);

  await supabase.from("actividades").delete().in("vendedor_id", idList);
  await supabase.from("ventas").delete().in("vendedor_id", idList);
  await supabase.from("metas_mensuales").delete().in("vendedor_id", idList);
  await supabase.from("metas_anuales").delete().in("vendedor_id", idList);
  console.log("  datos previos de estos 4 vendedores borrados\n");

  const metasMensuales: FilaMetaMensual[] = [];
  const metasAnuales: FilaMetaAnual[] = [];
  const ventas: FilaVenta[] = [];
  const actividades: FilaActividad[] = [];

  for (const v of VENDEDORES) {
    const id = ids[v.email];
    metasAnuales.push({ vendedor_id: id, anio: ANIO, meta_ventas_anual: v.metaVenta * 12 });

    for (const mes of MESES) {
      metasMensuales.push({
        vendedor_id: id,
        anio: ANIO,
        mes,
        meta_ventas: v.metaVenta,
        meta_contactos: META_ACT.contactos,
        meta_reuniones: META_ACT.reuniones,
        meta_oportunidades: META_ACT.oportunidades,
        meta_propuestas: META_ACT.propuestas,
      });

      const totalMes = Math.max(0, Math.round(jitter(v.metaVenta * v.ratioVenta, 0.18)));
      for (const monto of repartirMonto(totalMes, randInt(4, 9))) {
        ventas.push({
          vendedor_id: id,
          fecha: fechaEnMes(mes),
          monto,
          cliente: pick(CLIENTES),
          nota: null,
        });
      }

      for (const [tipo, meta] of TIPOS) {
        const count = Math.max(0, Math.round(jitter(meta * v.ratioActividad, 0.25)));
        for (let i = 0; i < count; i++) {
          const nota = pick(NOTAS_ACT);
          actividades.push({
            vendedor_id: id,
            tipo,
            fecha: fechaEnMes(mes),
            nota: nota || null,
          });
        }
      }
    }
  }

  await insertarEnLotes("metas_anuales", metasAnuales);
  await insertarEnLotes("metas_mensuales", metasMensuales);
  await insertarEnLotes("ventas", ventas);
  await insertarEnLotes("actividades", actividades);

  console.log(`\n  ✓ Demo lista. Vendedores (contraseña: ${PASSWORD}):`);
  for (const v of VENDEDORES) console.log(`    - ${v.email}  —  ${v.nombre}`);
  console.log("");
}

main().catch((e) => {
  console.error("\n  ✗ Error sembrando la demo:\n", e, "\n");
  process.exit(1);
});
