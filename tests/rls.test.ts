/**
 * Prueba de Row Level Security contra el proyecto Supabase real.
 *
 * Requiere .env.local con:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Si faltan, la prueba se omite (no falla) para no romper CI sin secretos.
 *
 * Crea dos vendedores temporales, inicia sesión como uno y comprueba que
 * NO puede leer ni modificar los datos del otro. Al final los borra.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hayCredenciales = Boolean(URL && ANON && SERVICE);
const d = hayCredenciales ? describe : describe.skip;

const sufijo = Date.now();
const vendedorA = {
  email: `rls-a-${sufijo}@ejemplo.com`,
  password: "PruebaRls12345",
};
const vendedorB = {
  email: `rls-b-${sufijo}@ejemplo.com`,
  password: "PruebaRls12345",
};

d("Row Level Security", () => {
  let admin: SupabaseClient;
  let idA = "";
  let idB = "";

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: vendedorA.email,
      password: vendedorA.password,
      email_confirm: true,
      user_metadata: { nombre: "RLS A", rol: "vendedor" },
    });
    idA = a.data.user!.id;

    const b = await admin.auth.admin.createUser({
      email: vendedorB.email,
      password: vendedorB.password,
      email_confirm: true,
      user_metadata: { nombre: "RLS B", rol: "vendedor" },
    });
    idB = b.data.user!.id;

    // Una venta de cada uno.
    await admin.from("ventas").insert([
      { vendedor_id: idA, fecha: "2026-01-10", monto: 100, cliente: "Cliente A" },
      { vendedor_id: idB, fecha: "2026-01-10", monto: 200, cliente: "Cliente B" },
    ]);
  }, 30000);

  afterAll(async () => {
    if (idA) await admin.auth.admin.deleteUser(idA);
    if (idB) await admin.auth.admin.deleteUser(idB);
  });

  it("un vendedor solo ve su propio perfil", async () => {
    const cli = createClient(URL!, ANON!);
    await cli.auth.signInWithPassword(vendedorA);

    const { data } = await cli.from("profiles").select("id");
    const ids = (data ?? []).map((r) => r.id);

    expect(ids).toContain(idA);
    expect(ids).not.toContain(idB);
  });

  it("un vendedor solo ve sus propias ventas", async () => {
    const cli = createClient(URL!, ANON!);
    await cli.auth.signInWithPassword(vendedorA);

    const { data } = await cli.from("ventas").select("vendedor_id, cliente");
    const deOtros = (data ?? []).filter((v) => v.vendedor_id !== idA);

    expect(deOtros).toHaveLength(0);
  });

  it("un vendedor no puede modificar la venta de otro", async () => {
    const cli = createClient(URL!, ANON!);
    await cli.auth.signInWithPassword(vendedorA);

    const { data: ventaB } = await admin
      .from("ventas")
      .select("id")
      .eq("vendedor_id", idB)
      .single();

    const { data: actualizadas } = await cli
      .from("ventas")
      .update({ monto: 999 })
      .eq("id", ventaB!.id)
      .select();

    // RLS deja pasar el UPDATE pero no afecta ninguna fila.
    expect(actualizadas ?? []).toHaveLength(0);
  });
});
