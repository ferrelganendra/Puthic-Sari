alter table public.products
  drop constraint if exists products_discount_percent_range;

alter table public.products
  add constraint products_discount_percent_range
  check (discount_percent between 0 and 100);
