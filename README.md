# Pulso Comercial

Aplicación web para que un **Administrador comercial** monitoree la actividad y las
ventas de su equipo frente a metas mensuales y anuales, e identifique brechas de
desempeño y baja actividad. Cada **Vendedor** registra su propia actividad y sus
ventas y consulta su desempeño individual.

Es un ejercicio de curso: prioriza funcionamiento, persistencia y cálculos
correctos por encima de la estética.

## Tecnología

| Pieza | Elección |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (Postgres gestionado) |
| Autenticación | Supabase Auth (correo + contraseña) |
| Aislamiento de datos | Row Level Security en Postgres |
| Gráficas | Recharts |
| Tests | Vitest |
| Hosting | Vercel |

## Requisitos previos

- Node.js 20 o superior.
- Una cuenta y un proyecto en [Supabase](https://supabase.com) (plan gratuito).
- Una cuenta en [Vercel](https://vercel.com) para el despliegue.

## Puesta en marcha (local)

1. **Instala dependencias**

   ```bash
   npm install
   ```

2. **Configura las variables de entorno**

   Copia `.env.example` a `.env.local` y rellena los valores de tu proyecto
   Supabase (Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: públicos.
   - `SUPABASE_SERVICE_ROLE_KEY`: **secreto**, solo servidor. Nunca lo publiques.

3. **Crea las tablas y las políticas**

   En el Dashboard de Supabase → SQL Editor, ejecuta en orden:

   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`

4. **Crea el primer Administrador**

   Rellena `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env.local` y ejecuta:

   ```bash
   npm run seed
   ```

5. **Arranca la aplicación**

   ```bash
   npm run dev
   ```

   Abre <http://localhost:3000> e inicia sesión con el correo y la contraseña del
   Administrador.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compilación de producción. |
| `npm start` | Sirve la compilación de producción. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Comprobación de tipos (`tsc --noEmit`). |
| `npm test` | Tests con Vitest. |
| `npm run seed` | Crea/actualiza el primer Administrador (usa `.env.local`). |

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, **Import Project** desde ese repositorio.
3. Define las variables de entorno del proyecto en Vercel:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_MONEDA_SIMBOLO`.
4. Cada `git push` a la rama principal genera un despliegue.

## Estructura

```
src/
  app/              Rutas (una carpeta = una pantalla)
  lib/
    supabase/       Clientes de Supabase (servidor, navegador, admin)
    calculos.ts     Fórmulas de la ficha §2.4 (funciones puras)
    periodos.ts     Helpers de mes/año y selector de período
    formato.ts      Formato de moneda y porcentajes
    constantes.ts   Roles y tipos de actividad
    db.types.ts     Tipos de las tablas
  proxy.ts          Refresco de sesión + protección de rutas
supabase/migrations/  Esquema SQL y políticas RLS
scripts/seed-admin.ts Alta del primer Administrador
tests/                Tests de Vitest
```

## Estado

En construcción por módulos:

- [x] **Módulo 0** — Preparación e infraestructura.
- [x] **Módulo 1** — Base de app, usuarios y administración.
- [x] **Módulo 2** — Registro de actividades y ventas.
- [x] **Módulo 3** — Indicadores y Dashboard.
- [x] **Módulo 4** — Histórico y visualización.

MVP completo. Pendiente: despliegue en Vercel.
