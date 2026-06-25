grant usage on schema public to service_role;

grant select on public.products to service_role;
grant select on public.categories to service_role;
grant select on public.discounts to service_role;
grant select on public.occasions to service_role;
grant select on public.product_occasions to service_role;
grant select on public.banners to service_role;
grant select on public.reviews to service_role;

grant select, insert, update, delete on public.checkout_orders to service_role;
grant select, insert, update, delete on public.checkout_order_items to service_role;
grant select, insert, update, delete on public.checkout_payment_events to service_role;
grant select, insert, update, delete on public.checkout_shipment_events to service_role;

grant usage, select on all sequences in schema public to service_role;
