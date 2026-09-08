/** Roles del sistema (ficha §2.1). */
export const ROLES = ["admin", "vendedor"] as const;
export type Rol = (typeof ROLES)[number];

/**
 * Tipos de actividad comercial.
 * "Oportunidad creada" dejó de ser una actividad: se gestiona como entidad
 * propia (ver src/app/(privado)/oportunidades y la tabla `oportunidades`).
 */
export const TIPOS_ACTIVIDAD = [
  { valor: "contacto", etiqueta: "Contacto / llamada" },
  { valor: "reunion", etiqueta: "Reunión comercial" },
  { valor: "propuesta", etiqueta: "Propuesta enviada" },
] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number]["valor"];

export const VALORES_TIPO_ACTIVIDAD = TIPOS_ACTIVIDAD.map(
  (t) => t.valor,
) as readonly TipoActividad[];

/** Metas mensuales de actividad, en el mismo orden que TIPOS_ACTIVIDAD. */
export const CAMPOS_META_ACTIVIDAD = [
  {
    tipo: "contacto",
    campo: "meta_contactos",
    etiqueta: "Contactos / llamadas",
    etiquetaCorta: "Contactos",
  },
  {
    tipo: "reunion",
    campo: "meta_reuniones",
    etiqueta: "Reuniones comerciales",
    etiquetaCorta: "Reuniones",
  },
  {
    tipo: "propuesta",
    campo: "meta_propuestas",
    etiqueta: "Propuestas enviadas",
    etiquetaCorta: "Propuestas",
  },
] as const;

/** Estados del ciclo de vida de una oportunidad (Módulo 5). */
export const ESTADOS_OPORTUNIDAD = [
  { valor: "abierta", etiqueta: "Abierta" },
  { valor: "ganada", etiqueta: "Ganada" },
  { valor: "perdida", etiqueta: "Perdida" },
] as const;

export type EstadoOportunidad = (typeof ESTADOS_OPORTUNIDAD)[number]["valor"];

export const VALORES_ESTADO_OPORTUNIDAD = ESTADOS_OPORTUNIDAD.map(
  (e) => e.valor,
) as readonly EstadoOportunidad[];
