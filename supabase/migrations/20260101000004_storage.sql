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
