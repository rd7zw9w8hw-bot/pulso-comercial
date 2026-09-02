-- Pulso Comercial — Row Level Security (Módulo 0)
-- Aplica el aislamiento de la ficha (regla 8): un vendedor solo ve y modifica
-- sus propios datos; el administrador ve y modifica todo.
-- Ejecutar DESPUÉS de 0001_schema.sql.

-- =========================================================================
-- Helper: ¿el usuario actual es administrador?
-- security definer + search_path vacío para no reentrar en las políticas
-- de public.profiles (evita recursión infinita en RLS).
-- =========================================================================
create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and rol = 'admin'
      and activo = true
  );
$$;

-- =========================================================================
-- Activar RLS
-- =========================================================================
alter table public.profiles        enable row level security;
alter table public.metas_mensuales enable row level security;
alter table public.metas_anuales   enable row level security;
alter table public.actividades     enable row level security;
alter table public.ventas          enable row level security;

-- =========================================================================
-- profiles: cada quien lee su perfil; solo el admin escribe
-- (el alta de usuarios la hace el trigger handle_new_user con security definer)
-- =========================================================================
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.es_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (public.es_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete using (public.es_admin());

-- =========================================================================
-- metas_mensuales y metas_anuales: lee el dueño o el admin; escribe solo el admin
-- =========================================================================
drop policy if exists "metas_mensuales_select" on public.metas_mensuales;
create policy "metas_mensuales_select" on public.metas_mensuales
  for select using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "metas_mensuales_insert" on public.metas_mensuales;
create policy "metas_mensuales_insert" on public.metas_mensuales
  for insert with check (public.es_admin());

drop policy if exists "metas_mensuales_update" on public.metas_mensuales;
create policy "metas_mensuales_update" on public.metas_mensuales
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "metas_mensuales_delete" on public.metas_mensuales;
create policy "metas_mensuales_delete" on public.metas_mensuales
  for delete using (public.es_admin());

drop policy if exists "metas_anuales_select" on public.metas_anuales;
create policy "metas_anuales_select" on public.metas_anuales
  for select using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "metas_anuales_insert" on public.metas_anuales;
create policy "metas_anuales_insert" on public.metas_anuales
  for insert with check (public.es_admin());

drop policy if exists "metas_anuales_update" on public.metas_anuales;
create policy "metas_anuales_update" on public.metas_anuales
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "metas_anuales_delete" on public.metas_anuales;
create policy "metas_anuales_delete" on public.metas_anuales
  for delete using (public.es_admin());

-- =========================================================================
-- actividades y ventas: el vendedor gestiona SOLO las propias; el admin, todas
-- =========================================================================
drop policy if exists "actividades_select" on public.actividades;
create policy "actividades_select" on public.actividades
  for select using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "actividades_insert" on public.actividades;
create policy "actividades_insert" on public.actividades
  for insert with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "actividades_update" on public.actividades;
create policy "actividades_update" on public.actividades
  for update using (vendedor_id = auth.uid() or public.es_admin())
  with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "actividades_delete" on public.actividades;
create policy "actividades_delete" on public.actividades
  for delete using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "ventas_select" on public.ventas;
create policy "ventas_select" on public.ventas
  for select using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "ventas_insert" on public.ventas;
create policy "ventas_insert" on public.ventas
  for insert with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "ventas_update" on public.ventas;
create policy "ventas_update" on public.ventas
  for update using (vendedor_id = auth.uid() or public.es_admin())
  with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "ventas_delete" on public.ventas;
create policy "ventas_delete" on public.ventas
  for delete using (vendedor_id = auth.uid() or public.es_admin());
