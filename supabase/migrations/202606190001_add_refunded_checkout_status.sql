alter table public.checkout_orders
  drop constraint if exists checkout_orders_status_check;

alter table public.checkout_orders
  add constraint checkout_orders_status_check
  check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'payment_failed', 'refunded'));
