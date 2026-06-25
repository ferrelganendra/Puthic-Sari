-- Rename categories from Male → Pria and Female → Wanita to match code
update public.categories set name = 'Pria' where name = 'Male';
update public.categories set name = 'Wanita' where name = 'Female';
update public.products set category = 'Pria' where category = 'Male';
update public.products set category = 'Wanita' where category = 'Female';
