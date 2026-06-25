drop policy if exists insert_own_profile on public.profiles;
drop policy if exists update_own_profile on public.profiles;
drop policy if exists read_own_profile on public.profiles;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can update own customer profile" on public.profiles;
create policy "Users can update own customer profile"
on public.profiles for update
to authenticated
using (id = auth.uid() and role = 'customer')
with check (id = auth.uid() and role = 'customer');
