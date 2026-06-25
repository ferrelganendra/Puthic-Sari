create extension if not exists pgcrypto;

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  destination_address text not null,
  destination_postal_code integer not null,
  destination_note text,
  order_note text,
  subtotal_amount integer not null check (subtotal_amount >= 0),
  shipping_amount integer not null check (shipping_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  currency text not null default 'IDR',
  selected_courier jsonb not null default '{}'::jsonb,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'payment_failed', 'refunded')
  ),
  payment_status text not null default 'pending',
  shipment_status text not null default 'not_created',
  midtrans_order_id text unique,
  midtrans_transaction_id text,
  midtrans_payment_type text,
  midtrans_redirect_url text,
  biteship_order_id text unique,
  biteship_waybill_id text,
  paid_at timestamptz,
  shipped_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.checkout_orders(id) on delete cascade,
  product_id bigint,
  product_name text not null,
  product_description text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount integer not null check (subtotal_amount >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.checkout_orders(id) on delete set null,
  provider text not null default 'midtrans',
  provider_order_id text,
  event_type text,
  transaction_status text,
  fraud_status text,
  signature_valid boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_shipment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.checkout_orders(id) on delete set null,
  provider text not null default 'biteship',
  provider_order_id text,
  event_type text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists checkout_orders_user_id_idx on public.checkout_orders(user_id);
create index if not exists checkout_orders_status_idx on public.checkout_orders(status);
create index if not exists checkout_orders_midtrans_order_id_idx on public.checkout_orders(midtrans_order_id);
create index if not exists checkout_order_items_order_id_idx on public.checkout_order_items(order_id);
create index if not exists checkout_payment_events_order_id_idx on public.checkout_payment_events(order_id);
create index if not exists checkout_shipment_events_order_id_idx on public.checkout_shipment_events(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_checkout_orders_updated_at on public.checkout_orders;
create trigger set_checkout_orders_updated_at
before update on public.checkout_orders
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

alter table public.checkout_orders enable row level security;
alter table public.checkout_order_items enable row level security;
alter table public.checkout_payment_events enable row level security;
alter table public.checkout_shipment_events enable row level security;

drop policy if exists "Users can read own orders" on public.checkout_orders;
create policy "Users can read own orders"
on public.checkout_orders for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read own order items" on public.checkout_order_items;
create policy "Users can read own order items"
on public.checkout_order_items for select
using (
  public.is_admin()
  or exists (
    select 1 from public.checkout_orders
    where checkout_orders.id = checkout_order_items.order_id
      and checkout_orders.user_id = auth.uid()
  )
);

drop policy if exists "Admins can read payment events" on public.checkout_payment_events;
create policy "Admins can read payment events"
on public.checkout_payment_events for select
using (public.is_admin());

drop policy if exists "Admins can read shipment events" on public.checkout_shipment_events;
create policy "Admins can read shipment events"
on public.checkout_shipment_events for select
using (public.is_admin());

revoke all on public.checkout_orders from anon, authenticated;
revoke all on public.checkout_order_items from anon, authenticated;
revoke all on public.checkout_payment_events from anon, authenticated;
revoke all on public.checkout_shipment_events from anon, authenticated;
grant select on public.checkout_orders to authenticated;
grant select on public.checkout_order_items to authenticated;
grant select on public.checkout_payment_events to authenticated;
grant select on public.checkout_shipment_events to authenticated;
