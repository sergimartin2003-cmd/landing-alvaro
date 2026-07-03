-- =====================================================================
-- GTshop · SETUP TODO EN UNO
-- Pega TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Crea el esquema, la seguridad (RLS), funciones, storage y datos demo.
-- Después, crea tu usuario admin (ver el final del archivo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 20260101000001_schema.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- GTshop · Esquema base
-- Tablas: categories, products, product_variants, orders, order_items,
--         admin_users. Enum de estado de pedido, secuencia + trigger de
--         nº de pedido (GT-00001) y trigger updated_at.
-- =====================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Enum de estado del pedido
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pendiente',
      'pagado',
      'preparando',
      'enviado',
      'entregado',
      'cancelado'
    );
  end if;
end$$;

-- Secuencia para el nº de pedido legible (GT-00001, GT-00002, ...)
create sequence if not exists public.order_number_seq start 1;

-- ---------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Productos (marca propia GTshop)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  category_id uuid not null references public.categories(id) on delete restrict,
  base_price  numeric(10, 2) not null default 0 check (base_price >= 0),
  images      text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- ---------------------------------------------------------------------
-- Variantes de producto (talla + stock + sku)
-- ---------------------------------------------------------------------
create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      int  not null default 0 check (stock >= 0),
  sku        text not null unique,
  created_at timestamptz not null default now(),
  unique (product_id, size)
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique,
  customer_name        text not null,
  customer_email       text not null,
  customer_phone       text,
  shipping_address     text not null,
  shipping_city        text not null,
  shipping_postal_code text not null,
  shipping_country     text not null default 'España',
  total_amount         numeric(10, 2) not null default 0,
  status               public.order_status not null default 'pendiente',
  stripe_session_id    text,
  created_at           timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_stripe_session_idx on public.orders (stripe_session_id);

-- ---------------------------------------------------------------------
-- Líneas de pedido (con snapshots de nombre/talla/precio)
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variant_id   uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  size         text not null,
  quantity     int  not null check (quantity > 0),
  unit_price   numeric(10, 2) not null check (unit_price >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- Administradores (marca qué usuarios de auth.users son admin)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Trigger: asigna nº de pedido GT-00001 si no viene informado
-- ---------------------------------------------------------------------
create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'GT-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_order_number on public.orders;
create trigger orders_set_order_number
  before insert on public.orders
  for each row execute function public.set_order_number();

-- ---------------------------------------------------------------------
-- Trigger: mantiene products.updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 20260101000002_rls.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- GTshop · Row Level Security
-- Público: lee categories (todo) y products/product_variants activos.
-- Admin (is_admin): lee/escribe todo, incluidos orders/order_items.
-- El webhook de Stripe usa la service-role key => salta RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: ¿el usuario actual es admin?
-- SECURITY DEFINER para poder consultar admin_users sin recursión de RLS.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ---------------------------------------------------------------------
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.admin_users      enable row level security;

-- ---------------------------------------------------------------------
-- categories: lectura pública, escritura admin
-- ---------------------------------------------------------------------
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- products: lectura pública SOLO activos (admin ve todo), escritura admin
-- ---------------------------------------------------------------------
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (active = true or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- product_variants: lectura pública si el producto padre está activo
-- ---------------------------------------------------------------------
drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.active = true
    )
  );

drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- orders / order_items: SOLO admin (sin lectura pública)
-- ---------------------------------------------------------------------
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- admin_users: el admin puede leerse; escritura solo vía service-role/SQL
-- ---------------------------------------------------------------------
drop policy if exists admin_users_admin_read on public.admin_users;
create policy admin_users_admin_read on public.admin_users
  for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- Privilegios de tabla (least-privilege).
-- OJO: la RLS es la verdadera puerta de acceso; los GRANT solo dicen
-- "qué operaciones son posibles" y luego la policy filtra las filas.
-- En Supabase, anon/authenticated ya reciben grants por defecto; aquí
-- los declaramos explícitamente para que el esquema sea portable.
-- El público NUNCA escribe pedidos: eso lo hace la service-role (checkout
-- Server Action + webhook), que salta la RLS.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- Público (anon) y usuarios logueados: solo lectura del catálogo.
grant select on public.categories       to anon, authenticated;
grant select on public.products         to anon, authenticated;
grant select on public.product_variants to anon, authenticated;

-- Admin (rol authenticated + is_admin): CRUD del catálogo y lectura de pedidos.
grant select, insert, update, delete on public.categories       to authenticated;
grant select, insert, update, delete on public.products         to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update, delete on public.orders           to authenticated;
grant select, insert, update, delete on public.order_items      to authenticated;
grant select on public.admin_users to authenticated;

-- service_role: crea pedidos y descuenta stock (bypassrls).
grant all on public.categories       to service_role;
grant all on public.products         to service_role;
grant all on public.product_variants to service_role;
grant all on public.orders           to service_role;
grant all on public.order_items      to service_role;
grant all on public.admin_users      to service_role;

grant usage, select on sequence public.order_number_seq to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 20260101000003_functions.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- GTshop · Funciones RPC + Realtime
-- confirm_order_paid: marca el pedido como pagado y descuenta stock de
-- forma atómica e idempotente (la llama el webhook de Stripe).
-- =====================================================================

create or replace function public.confirm_order_paid(
  p_order_id   uuid,
  p_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  -- Bloquea la fila para evitar carreras entre webhooks duplicados.
  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if v_status is null then
    raise exception 'Pedido % no encontrado', p_order_id;
  end if;

  -- Idempotencia: si ya no está pendiente, no repetimos el descuento.
  if v_status <> 'pendiente' then
    return;
  end if;

  -- Descuenta stock de cada variante comprada (nunca por debajo de 0).
  update public.product_variants v
  set stock = greatest(v.stock - oi.quantity, 0)
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.variant_id = v.id;

  -- Marca el pedido como pagado y guarda la sesión de Stripe.
  update public.orders
  set status = 'pagado',
      stripe_session_id = coalesce(p_session_id, stripe_session_id)
  where id = p_order_id;
end;
$$;

-- Solo la service-role (webhook) debe poder ejecutarla.
revoke all on function public.confirm_order_paid(uuid, text) from public;
revoke all on function public.confirm_order_paid(uuid, text) from anon;
revoke all on function public.confirm_order_paid(uuid, text) from authenticated;
grant execute on function public.confirm_order_paid(uuid, text) to service_role;

-- ---------------------------------------------------------------------
-- Realtime: publica cambios de `orders` para la Terminal de Ventas.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception when duplicate_object then
      null; -- ya estaba en la publicación
    end;
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 20260101000004_storage.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- GTshop · Storage
-- Bucket público `product-images`. Lectura pública; escritura solo admin.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Lectura pública de las imágenes de producto.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

-- Subida solo para admins autenticados.
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

-- Actualización solo para admins.
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- Borrado solo para admins.
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- seed.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- GTshop · Seed de datos de ejemplo
-- 7 categorías + 4 productos de marca propia con variantes/stock.
-- Ejecútalo con `supabase db reset` (lo aplica automáticamente) o
-- `psql < supabase/seed.sql`. Las imágenes son placeholders de picsum.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Categorías (idempotente por slug)
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, order_index) values
  ('Camisetas',           'camisetas',   1),
  ('Sudaderas / Hoodies', 'sudaderas',   2),
  ('Pantalones',          'pantalones',  3),
  ('Chaquetas',           'chaquetas',   4),
  ('Shorts',              'shorts',      5),
  ('Accesorios',          'accesorios',  6),
  ('Calzado',             'calzado',     7)
on conflict (slug) do update
  set name = excluded.name,
      order_index = excluded.order_index;

-- ---------------------------------------------------------------------
-- Productos de ejemplo
-- ---------------------------------------------------------------------
insert into public.products (name, slug, description, category_id, base_price, images, active)
select
  'Camiseta Oversize GT Basic',
  'camiseta-oversize-gt-basic',
  'Camiseta de corte oversize en algodón orgánico 240 g. Placeholder de descripción: edítalo desde la Terminal de Productos.',
  c.id, 24.90,
  array[
    'https://picsum.photos/seed/gt-tee-1/900/1100',
    'https://picsum.photos/seed/gt-tee-2/900/1100'
  ],
  true
from public.categories c where c.slug = 'camisetas'
on conflict (slug) do nothing;

insert into public.products (name, slug, description, category_id, base_price, images, active)
select
  'Hoodie GT Essential',
  'hoodie-gt-essential',
  'Sudadera con capucha felpa perchada 400 g, bolsillo canguro y cordón a tono. Placeholder editable.',
  c.id, 49.90,
  array[
    'https://picsum.photos/seed/gt-hoodie-1/900/1100',
    'https://picsum.photos/seed/gt-hoodie-2/900/1100'
  ],
  true
from public.categories c where c.slug = 'sudaderas'
on conflict (slug) do nothing;

insert into public.products (name, slug, description, category_id, base_price, images, active)
select
  'Pantalón Cargo GT Street',
  'pantalon-cargo-gt-street',
  'Cargo de sarga resistente con bolsillos laterales y bajo ajustable. Placeholder editable.',
  c.id, 59.90,
  array[
    'https://picsum.photos/seed/gt-cargo-1/900/1100'
  ],
  true
from public.categories c where c.slug = 'pantalones'
on conflict (slug) do nothing;

insert into public.products (name, slug, description, category_id, base_price, images, active)
select
  'Gorra GT Logo',
  'gorra-gt-logo',
  'Gorra de 6 paneles con logo GT bordado y cierre trasero regulable. Placeholder editable.',
  c.id, 19.90,
  array[
    'https://picsum.photos/seed/gt-cap-1/900/1100'
  ],
  true
from public.categories c where c.slug = 'accesorios'
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Variantes (talla + stock + sku). Idempotente por sku.
-- ---------------------------------------------------------------------
-- Camiseta Oversize: XS-XXL
insert into public.product_variants (product_id, size, stock, sku)
select p.id, v.size, v.stock, v.sku
from public.products p
join (values
  ('XS', 8,  'GT-TEE-XS'),
  ('S',  15, 'GT-TEE-S'),
  ('M',  20, 'GT-TEE-M'),
  ('L',  18, 'GT-TEE-L'),
  ('XL', 10, 'GT-TEE-XL'),
  ('XXL', 5, 'GT-TEE-XXL')
) as v(size, stock, sku) on true
where p.slug = 'camiseta-oversize-gt-basic'
on conflict (sku) do nothing;

-- Hoodie: S-XL
insert into public.product_variants (product_id, size, stock, sku)
select p.id, v.size, v.stock, v.sku
from public.products p
join (values
  ('S',  12, 'GT-HOODIE-S'),
  ('M',  14, 'GT-HOODIE-M'),
  ('L',  9,  'GT-HOODIE-L'),
  ('XL', 6,  'GT-HOODIE-XL')
) as v(size, stock, sku) on true
where p.slug = 'hoodie-gt-essential'
on conflict (sku) do nothing;

-- Cargo: S-XL (XL agotado para probar el deshabilitado de tallas)
insert into public.product_variants (product_id, size, stock, sku)
select p.id, v.size, v.stock, v.sku
from public.products p
join (values
  ('S',  7, 'GT-CARGO-S'),
  ('M',  11, 'GT-CARGO-M'),
  ('L',  4, 'GT-CARGO-L'),
  ('XL', 0, 'GT-CARGO-XL')
) as v(size, stock, sku) on true
where p.slug = 'pantalon-cargo-gt-street'
on conflict (sku) do nothing;

-- Gorra: talla única
insert into public.product_variants (product_id, size, stock, sku)
select p.id, v.size, v.stock, v.sku
from public.products p
join (values
  ('Única', 30, 'GT-CAP-U')
) as v(size, stock, sku) on true
where p.slug = 'gorra-gt-logo'
on conflict (sku) do nothing;

-- =====================================================================
-- ÚLTIMO PASO · CONVIÉRTETE EN ADMIN
-- 1) Supabase → Authentication → Users → Add user (email + contraseña,
--    marca "Auto Confirm User").
-- 2) Copia su User UID y ejecútalo aquí (sustituye los valores):
--
-- insert into public.admin_users (user_id, email)
-- values ('PEGA-AQUI-EL-UID', 'tu@email.com');
-- =====================================================================
