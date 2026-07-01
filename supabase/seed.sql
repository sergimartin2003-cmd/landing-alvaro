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
