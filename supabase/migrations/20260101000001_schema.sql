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
