/** Roles del sistema (ficha §2.1). */
export const ROLES = ["admin", "vendedor"] as const;
export type Rol = (typeof ROLES)[number];

/** Tipos de actividad comercial (ficha §2.1). */
export const TIPOS_ACTIVIDAD = [
  { valor: "contacto", etiqueta: "Contacto / llamada" },
  { valor: "reunion", etiqueta: "Reunión comercial" },
  { valor: "oportunidad", etiqueta: "Oportunidad creada" },
  { valor: "propuesta", etiqueta: "Propuesta enviada" },
] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number]["valor"];

export const VALORES_TIPO_ACTIVIDAD = TIPOS_ACTIVIDAD.map(
  (t) => t.valor,
) as readonly TipoActividad[];

/** Metas mensuales de actividad, en el mismo orden que TIPOS_ACTIVIDAD. */
export const CAMPOS_META_ACTIVIDAD = [
  { tipo: "contacto", campo: "meta_contactos", etiqueta: "Contactos / llamadas" },
  { tipo: "reunion", campo: "meta_reuniones", etiqueta: "Reuniones" },
  { tipo: "oportunidad", campo: "meta_oportunidades", etiqueta: "Oportunidades" },
  { tipo: "propuesta", campo: "meta_propuestas", etiqueta: "Propuestas" },
] as const;
