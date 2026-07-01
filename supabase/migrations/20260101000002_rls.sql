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
