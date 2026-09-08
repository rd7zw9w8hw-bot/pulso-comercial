/**
 * Tipos de la base de datos.
 *
 * Escritos a mano para reflejar supabase/migrations/0001_schema.sql.
 * Cuando enlaces la CLI de Supabase puedes regenerarlos con:
 *   npx supabase gen types typescript --linked > src/lib/db.types.ts
 */

export type Rol = "admin" | "vendedor";
export type TipoActividad = "contacto" | "reunion" | "propuesta";
export type EstadoOportunidad = "abierta" | "ganada" | "perdida";

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

export interface MetaMensual {
  id: number;
  vendedor_id: string;
  anio: number;
  mes: number;
  meta_ventas: number;
  meta_contactos: number;
  meta_reuniones: number;
  meta_oportunidades: number;
  meta_propuestas: number;
}

export interface MetaAnual {
  id: number;
  vendedor_id: string;
  anio: number;
  meta_ventas_anual: number;
}

export interface Actividad {
  id: number;
  vendedor_id: string;
  tipo: TipoActividad;
  fecha: string; // YYYY-MM-DD
  nota: string | null;
  creado_en: string;
}

export interface Venta {
  id: number;
  vendedor_id: string;
  fecha: string; // YYYY-MM-DD
  monto: number;
  cliente: string | null;
  nota: string | null;
  creado_en: string;
}

export interface Oportunidad {
  id: number;
  vendedor_id: string;
  cliente: string;
  descripcion: string | null;
  monto_estimado: number;
  estado: EstadoOportunidad;
  fecha_creacion: string; // YYYY-MM-DD
  fecha_cierre: string | null; // YYYY-MM-DD
  venta_id: number | null;
  nota: string | null;
  creado_en: string;
}
