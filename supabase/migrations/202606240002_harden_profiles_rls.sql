alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can create own customer profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Users can create own customer profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and role = 'customer');

create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
