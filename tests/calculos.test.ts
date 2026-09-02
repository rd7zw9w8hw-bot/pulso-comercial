import { describe, it, expect } from "vitest";
import {
  sumaMontos,
  contarPorTipo,
  porcentajeCumplimiento,
  brecha,
  resumenMonetario,
  resumenActividad,
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
    const r = resumenActividad(actividades, "reunion", 6);
    expect(r.realizado).toBe(4);
    expect(r.cumplimiento).toBeCloseTo(66.666, 2);
    expect(r.brecha).toBe(2);
  });
});
