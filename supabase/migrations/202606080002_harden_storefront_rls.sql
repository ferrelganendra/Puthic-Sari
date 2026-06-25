create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  description text default '',
  emoji text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id serial primary key,
  name text not null,
  type text not null default 'percentage',
  value numeric not null default 0,
  min_purchase numeric not null default 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  name text not null,
  email text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.occasions (
  id serial primary key,
  name text not null unique,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.product_occasions (
  product_id bigint not null,
  occasion_id integer not null references public.occasions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, occasion_id)
);

create table if not exists public.banners (
  id bigserial primary key,
  image_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists is_active boolean default true;
alter table public.products add column if not exists is_sold_out boolean default false;
alter table public.products add column if not exists is_best_seller boolean default false;
alter table public.products add column if not exists is_new_arrival boolean default false;
alter table public.products add column if not exists discount_percent integer default 0;
alter table public.categories add column if not exists is_active boolean default true;
alter table public.discounts add column if not exists is_active boolean default true;
alter table public.banners add column if not exists is_active boolean default true;
alter table public.reviews add column if not exists is_approved boolean default false;

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.discounts enable row level security;
alter table public.occasions enable row level security;
alter table public.product_occasions enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('products', 'categories', 'discounts', 'occasions', 'product_occasions', 'banners', 'reviews')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy "Public can read active products"
on public.products for select
using (is_active = true);

create policy "Admins can manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active categories"
on public.categories for select
using (is_active = true);

create policy "Admins can manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active discounts"
on public.discounts for select
using (is_active = true);

create policy "Admins can manage discounts"
on public.discounts for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read occasions"
on public.occasions for select
using (true);

create policy "Admins can manage occasions"
on public.occasions for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read product occasions"
on public.product_occasions for select
using (true);

create policy "Admins can manage product occasions"
on public.product_occasions for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active banners"
on public.banners for select
using (is_active = true);

create policy "Admins can manage banners"
on public.banners for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read approved reviews"
on public.reviews for select
using (is_approved = true);

create policy "Public can submit reviews"
on public.reviews for insert
with check (is_approved = false);

create policy "Admins can manage reviews"
on public.reviews for all
using (public.is_admin())
with check (public.is_admin());

revoke all on public.products from anon, authenticated;
revoke all on public.categories from anon, authenticated;
revoke all on public.discounts from anon, authenticated;
revoke all on public.occasions from anon, authenticated;
revoke all on public.product_occasions from anon, authenticated;
revoke all on public.banners from anon, authenticated;
revoke all on public.reviews from anon, authenticated;

grant select on public.products to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.discounts to anon, authenticated;
grant select on public.occasions to anon, authenticated;
grant select on public.product_occasions to anon, authenticated;
grant select on public.banners to anon, authenticated;
grant select, insert on public.reviews to anon, authenticated;

grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.discounts to authenticated;
grant insert, update, delete on public.occasions to authenticated;
grant insert, update, delete on public.product_occasions to authenticated;
grant insert, update, delete on public.banners to authenticated;
grant update, delete on public.reviews to authenticated;

grant usage, select on all sequences in schema public to authenticated;
