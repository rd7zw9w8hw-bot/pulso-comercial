-- Pulso Comercial — Módulo 5: gestión de oportunidades (mini-CRM ligero)
-- Re-ejecutable. Aplicar DESPUÉS de 0001 y 0002, y ANTES de desplegar el código nuevo.

-- =========================================================================
-- oportunidades: entidad que el vendedor gestiona (reemplaza al antiguo
-- tipo de actividad 'oportunidad'). Ciclo de vida: abierta -> ganada | perdida.
-- =========================================================================
create table if not exists public.oportunidades (
  id             bigint generated always as identity primary key,
  vendedor_id    uuid          not null references public.profiles (id) on delete cascade,
  cliente        text          not null,
  descripcion    text,
  monto_estimado numeric(14, 2) not null default 0 check (monto_estimado >= 0),
  estado         text          not null default 'abierta'
                   check (estado in ('abierta', 'ganada', 'perdida')),
  fecha_creacion date          not null,
  fecha_cierre   date,
  venta_id       bigint        references public.ventas (id) on delete set null,
  nota           text,
  creado_en      timestamptz   not null default now()
);

comment on table public.oportunidades is
  'Oportunidades comerciales. estado: abierta | ganada | perdida. venta_id enlaza la venta resultante (opcional).';

create index if not exists oportunidades_vendedor_fecha_idx
  on public.oportunidades (vendedor_id, fecha_creacion);
create index if not exists oportunidades_vendedor_estado_idx
  on public.oportunidades (vendedor_id, estado);

-- Una venta se enlaza como mucho a una oportunidad.
create unique index if not exists oportunidades_venta_unica_idx
  on public.oportunidades (venta_id)
  where venta_id is not null;

-- Coherencia del cierre: abierta => sin fecha_cierre; cerrada => con fecha_cierre.
alter table public.oportunidades
  drop constraint if exists oportunidades_cierre_coherente;
alter table public.oportunidades
  add constraint oportunidades_cierre_coherente check (
    (estado = 'abierta' and fecha_cierre is null)
    or (estado in ('ganada', 'perdida') and fecha_cierre is not null)
  );

-- =========================================================================
-- RLS: el vendedor gestiona SOLO las propias; el admin, todas.
-- =========================================================================
alter table public.oportunidades enable row level security;

drop policy if exists "oportunidades_select" on public.oportunidades;
create policy "oportunidades_select" on public.oportunidades
  for select using (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "oportunidades_insert" on public.oportunidades;
create policy "oportunidades_insert" on public.oportunidades
  for insert with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "oportunidades_update" on public.oportunidades;
create policy "oportunidades_update" on public.oportunidades
  for update using (vendedor_id = auth.uid() or public.es_admin())
  with check (vendedor_id = auth.uid() or public.es_admin());

drop policy if exists "oportunidades_delete" on public.oportunidades;
create policy "oportunidades_delete" on public.oportunidades
  for delete using (vendedor_id = auth.uid() or public.es_admin());

-- =========================================================================
-- 'oportunidad' deja de ser un tipo de actividad: ahora se gestiona en la
-- tabla oportunidades. Se borran las filas antiguas y se ajusta el CHECK.
-- =========================================================================
delete from public.actividades where tipo = 'oportunidad';

alter table public.actividades drop constraint if exists actividades_tipo_check;
alter table public.actividades
  add constraint actividades_tipo_check
  check (tipo in ('contacto', 'reunion', 'propuesta'));
