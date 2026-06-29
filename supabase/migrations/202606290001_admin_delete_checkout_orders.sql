-- Allow admins (and only admins) to DELETE checkout orders and order items.
-- Direct dashboard deletion needs table privileges plus matching RLS policies.

grant delete on public.checkout_orders to authenticated;
grant delete on public.checkout_order_items to authenticated;

drop policy if exists "Admins can delete order items" on public.checkout_order_items;
create policy "Admins can delete order items"
on public.checkout_order_items for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can delete orders" on public.checkout_orders;
create policy "Admins can delete orders"
on public.checkout_orders for delete
to authenticated
using (public.is_admin());
