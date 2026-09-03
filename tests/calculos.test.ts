import { describe, it, expect } from "vitest";
import {
  sumaMontos,
  contarPorTipo,
  porcentajeCumplimiento,
  brecha,
  resumenMonetario,
  resumenActividad,
  desempenoVendedor,
  desempenoEquipo,
} from "@/lib/calculos";

describe("sumaMontos", () => {
  it("suma montos numéricos", () => {
    expect(sumaMontos([{ monto: 100 }, { monto: 250.5 }, { monto: 0 }])).toBe(350.5);
  });

  it("acepta montos como texto (numeric de Postgres)", () => {
    expect(sumaMontos([{ monto: "100.00" }, { monto: "50.25" }])).toBe(150.25);
  });

  it("suma vacía es 0", () => {
    expect(sumaMontos([])).toBe(0);
  });
});

describe("contarPorTipo", () => {
  const actividades = [
    { tipo: "contacto" },
    { tipo: "contacto" },
    { tipo: "reunion" },
    { tipo: "propuesta" },
  ];

  it("cuenta solo el tipo pedido", () => {
    expect(contarPorTipo(actividades, "contacto")).toBe(2);
    expect(contarPorTipo(actividades, "reunion")).toBe(1);
    expect(contarPorTipo(actividades, "oportunidad")).toBe(0);
  });
});

describe("porcentajeCumplimiento", () => {
  it("realizado / meta * 100", () => {
    expect(porcentajeCumplimiento(50, 200)).toBe(25);
    expect(porcentajeCumplimiento(200, 200)).toBe(100);
    expect(porcentajeCumplimiento(300, 200)).toBe(150);
  });

  it("devuelve null cuando no hay meta (0 o negativa)", () => {
    expect(porcentajeCumplimiento(100, 0)).toBeNull();
    expect(porcentajeCumplimiento(100, -5)).toBeNull();
  });
});

describe("brecha", () => {
  it("meta menos realizado", () => {
    expect(brecha(1000, 400)).toBe(600); // falta
    expect(brecha(1000, 1200)).toBe(-200); // superada
    expect(brecha(0, 0)).toBe(0);
  });
});

describe("resumenMonetario", () => {
  it("caso conocido: 3 ventas contra meta de 10000", () => {
    const ventas = [{ monto: 2500 }, { monto: 3000 }, { monto: 1500 }];
    const r = resumenMonetario(ventas, 10000);
    expect(r.realizado).toBe(7000);
    expect(r.meta).toBe(10000);
    expect(r.cumplimiento).toBe(70);
    expect(r.brecha).toBe(3000);
  });

  it("sin meta: cumplimiento null, brecha negativa de lo realizado", () => {
    const r = resumenMonetario([{ monto: 500 }], 0);
    expect(r.cumplimiento).toBeNull();
    expect(r.brecha).toBe(-500);
  });
});

describe("resumenActividad", () => {
  it("caso conocido: 4 reuniones contra meta de 6", () => {
    const actividades = [
      { tipo: "reunion" },
      { tipo: "reunion" },
      { tipo: "reunion" },
      { tipo: "reunion" },
      { tipo: "contacto" },
    ];
    const r = resumenActividad(actividades, "reunion", "Reuniones", "Reuniones", 6);
    expect(r.realizado).toBe(4);
    expect(r.cumplimiento).toBeCloseTo(66.666, 2);
    expect(r.brecha).toBe(2);
  });
});

describe("desempenoVendedor", () => {
  // Caso conocido (datos de prueba de Ana, septiembre 2026):
  //  - ventas del mes: 8200 + 12500.50 = 20700.50
  //  - ventas del año: 20700.50 + 15000 (agosto) = 35700.50
  //  - actividad del mes: 1 reunión
  //  - meta mensual de ventas: 50000; meta anual: 600000
  //  - metas de actividad: contactos 40, reuniones 12, oportunidades 8, propuestas 6
  const resultado = desempenoVendedor({
    ventasMes: [{ monto: 8200 }, { monto: "12500.50" }],
    ventasAnio: [{ monto: 8200 }, { monto: "12500.50" }, { monto: 15000 }],
    actividadesMes: [{ tipo: "reunion" }],
    metaMensual: {
      meta_ventas: 50000,
      meta_contactos: 40,
      meta_reuniones: 12,
      meta_oportunidades: 8,
      meta_propuestas: 6,
    },
    metaVentasAnual: 600000,
  });

  it("ventas del mes vs meta mensual", () => {
    expect(resultado.mensual.realizado).toBe(20700.5);
    expect(resultado.mensual.cumplimiento).toBeCloseTo(41.401, 3);
    expect(resultado.mensual.brecha).toBe(29299.5);
  });

  it("ventas del año vs meta anual", () => {
    expect(resultado.anual.realizado).toBe(35700.5);
    expect(resultado.anual.cumplimiento).toBeCloseTo(5.95, 2);
    expect(resultado.anual.brecha).toBe(564299.5);
  });

  it("actividad del mes por tipo", () => {
    const porTipo = Object.fromEntries(
      resultado.actividades.map((a) => [a.tipo, a]),
    );
    expect(porTipo.reunion.realizado).toBe(1);
    expect(porTipo.reunion.cumplimiento).toBeCloseTo(8.333, 3);
    expect(porTipo.reunion.brecha).toBe(11);
    expect(porTipo.contacto.realizado).toBe(0);
    expect(porTipo.contacto.cumplimiento).toBe(0);
    expect(porTipo.contacto.brecha).toBe(40);
  });

  it("sin metas definidas: cumplimiento null", () => {
    const sinMetas = desempenoVendedor({
      ventasMes: [{ monto: 1000 }],
      ventasAnio: [{ monto: 1000 }],
      actividadesMes: [],
      metaMensual: null,
      metaVentasAnual: null,
    });
    expect(sinMetas.mensual.cumplimiento).toBeNull();
    expect(sinMetas.anual.cumplimiento).toBeNull();
    expect(sinMetas.actividades.every((a) => a.cumplimiento === null)).toBe(true);
  });
});

describe("desempenoEquipo", () => {
  const equipo = desempenoEquipo([
    {
      vendedorId: "a",
      nombre: "Ana",
      activo: true,
      ventasMes: [{ monto: 20000 }],
      ventasAnio: [{ monto: 50000 }],
      actividadesMes: [{ tipo: "reunion" }, { tipo: "contacto" }],
      metaVentasMes: 50000,
      metaVentasAnio: 600000,
    },
    {
      vendedorId: "b",
      nombre: "Beto",
      activo: true,
      ventasMes: [{ monto: 30000 }],
      ventasAnio: [{ monto: 90000 }],
      actividadesMes: [{ tipo: "propuesta" }],
      metaVentasMes: 40000,
      metaVentasAnio: 500000,
    },
  ]);

  it("una fila por vendedor con su resumen", () => {
    expect(equipo.filas).toHaveLength(2);
    expect(equipo.filas[0].mensual.realizado).toBe(20000);
    expect(equipo.filas[0].actividadesMes).toBe(2);
    expect(equipo.filas[1].mensual.cumplimiento).toBe(75);
  });

  it("totales consolidados del equipo", () => {
    expect(equipo.totalMensual.realizado).toBe(50000);
    expect(equipo.totalMensual.meta).toBe(90000);
    expect(equipo.totalMensual.cumplimiento).toBeCloseTo(55.556, 3);
    expect(equipo.totalMensual.brecha).toBe(40000);
    expect(equipo.totalAnual.realizado).toBe(140000);
    expect(equipo.totalAnual.meta).toBe(1100000);
  });
});
