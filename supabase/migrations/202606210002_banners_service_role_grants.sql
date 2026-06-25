-- Grant full CRUD on banners to service_role for Edge Function management.
-- Admin dashboard uses anon key + RLS, service_role bypasses RLS for backend ops.
grant select, insert, update, delete on public.banners to service_role;
