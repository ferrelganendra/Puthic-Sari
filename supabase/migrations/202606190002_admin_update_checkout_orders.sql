-- Allow admins (and only admins) to UPDATE checkout_orders.
-- The original secure-checkout migration (202606080001) granted SELECT only
-- and defined SELECT-only RLS policies, so admin status changes in the
-- dashboard fail with "permission denied for table checkout_orders" (403).
--
-- This migration is additive: it does NOT touch existing SELECT policies,
-- INSERT behavior (service-role only), or the customer read model.

-- 1) Table-level privilege. RLS still gates which ROWS can be updated;
--    without a matching policy this grant alone changes nothing for
--    non-admin authenticated users.
grant update on public.checkout_orders to authenticated;

-- 2) Admin-only UPDATE policy.
--    USING       -> which existing rows an admin may target (all rows).
--    WITH CHECK  -> the row after update must still satisfy is_admin(),
--                   i.e. only admins can produce the updated row.
--    Non-admin authenticated users have NO update policy, so PostgreSQL
--    denies their UPDATEs by default (RLS deny-by-default).
drop policy if exists "Admins can update orders" on public.checkout_orders;
create policy "Admins can update orders"
on public.checkout_orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
