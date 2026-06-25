alter table public.reviews
  add column if not exists product_id bigint references public.products(id) on delete cascade;

create index if not exists idx_reviews_product_approved_created
  on public.reviews (product_id, is_approved, created_at desc);

-- Keep legacy/productless reviews hidden from product pages; new reviews must attach to a product.
drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
on public.reviews for insert
with check (is_approved = false and product_id is not null);
