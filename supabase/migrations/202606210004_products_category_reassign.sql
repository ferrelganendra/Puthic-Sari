-- Grant UPDATE/DELETE on products to service_role (needed for admin CRUD)
grant update, delete on public.products to service_role;

-- Reassign all product categories to new top-level categories
-- Default: all existing artificial bouquets → "Artificial Flowers"
update public.products
set category = 'Artificial Flowers'
where category not in ('Artificial Flowers', 'Fresh Flowers', 'Giftbox', 'Male', 'Female');
