-- Pulso Comercial — Esquema base (Módulo 0)
-- Ejecutar en el proyecto Supabase: SQL Editor, o `supabase db push` si usas la CLI.
-- Depende de `auth.users`, que gestiona Supabase Auth.

-- =========================================================================
-- profiles: datos de aplicación de cada usuario (1:1 con auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text        not null,
  email      text        not null,
  rol        text        not null default 'vendedor' check (rol in ('admin', 'vendedor')),
  activo     boolean     not null default true,
  creado_en  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de aplicación por usuario. rol: admin | vendedor.';

-- Al crear un usuario en auth.users se crea automáticamente su profile,
-- tomando nombre/rol/activo de los metadatos si vienen definidos.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, email, rol, activo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), new.email),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'rol', ''), 'vendedor'),
    coalesce((new.raw_user_meta_data ->> 'activo')::boolean, true)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- metas_mensuales: por vendedor / año / mes
-- =========================================================================
create table if not exists public.metas_mensuales (
  id                 bigint generated always as identity primary key,
  vendedor_id        uuid    not null references public.profiles (id) on delete cascade,
  anio               int     not null,
  mes                int     not null check (mes between 1 and 12),
  meta_ventas        numeric(14, 2) not null default 0 check (meta_ventas >= 0),
  meta_contactos     int     not null default 0 check (meta_contactos >= 0),
  meta_reuniones     int     not null default 0 check (meta_reuniones >= 0),
  meta_oportunidades int     not null default 0 check (meta_oportunidades >= 0),
  meta_propuestas    int     not null default 0 check (meta_propuestas >= 0),
  unique (vendedor_id, anio, mes)
);

-- =========================================================================
-- metas_anuales: por vendedor / año (independiente de la meta mensual)
-- =========================================================================
create table if not exists public.metas_anuales (
  id                bigint generated always as identity primary key,
  vendedor_id       uuid not null references public.profiles (id) on delete cascade,
  anio              int  not null,
  meta_ventas_anual numeric(14, 2) not null default 0 check (meta_ventas_anual >= 0),
  unique (vendedor_id, anio)
);

-- =========================================================================
-- actividades: cada registro de actividad comercial de un vendedor
-- =========================================================================
create table if not exists public.actividades (
  id          bigint generated always as identity primary key,
  vendedor_id uuid        not null references public.profiles (id) on delete cascade,
  tipo        text        not null check (tipo in ('contacto', 'reunion', 'oportunidad', 'propuesta')),
  fecha       date        not null,
  nota        text,
  creado_en   timestamptz not null default now()
);

create index if not exists actividades_vendedor_fecha_idx
  on public.actividades (vendedor_id, fecha);

-- =========================================================================
-- ventas: resultado comercial (NO cuenta como actividad, ficha regla 11)
-- =========================================================================
create table if not exists public.ventas (
  id          bigint generated always as identity primary key,
  vendedor_id uuid        not null references public.profiles (id) on delete cascade,
  fecha       date        not null,
  monto       numeric(14, 2) not null check (monto >= 0),
  cliente     text,
  nota        text,
  creado_en   timestamptz not null default now()
);

create index if not exists ventas_vendedor_fecha_idx
  on public.ventas (vendedor_id, fecha);
