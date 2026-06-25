-- Grant full CRUD on categories to service_role for Edge Function / admin management
grant select, insert, update, delete on public.categories to service_role;

-- Delete old flower-type categories (no longer used as top-level navigation)
delete from public.categories
where name in ('Lily', 'Gerbera', 'Mix', 'Thumbelina', 'Sunflower', 'Hydrangea', 'Peony', 'Blue', 'Artificial');

-- Insert new top-level categories
insert into public.categories (name, description, is_active) values
  ('Artificial Flowers', 'Koleksi buket bunga artificial tahan lama', true),
  ('Fresh Flowers', 'Buket bunga segar pilihan untuk momen spesial', true),
  ('Giftbox', 'Buket & hadiah dalam kemasan gift box eksklusif', true),
  ('Male', 'Koleksi buket untuk pria', true),
  ('Female', 'Koleksi buket untuk wanita', true)
on conflict do nothing;
