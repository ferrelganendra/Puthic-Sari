alter table public.products
  add column if not exists weight_grams integer not null default 500 check (weight_grams > 0),
  add column if not exists length_cm integer check (length_cm is null or length_cm > 0),
  add column if not exists width_cm integer check (width_cm is null or width_cm > 0),
  add column if not exists height_cm integer check (height_cm is null or height_cm > 0);
