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
