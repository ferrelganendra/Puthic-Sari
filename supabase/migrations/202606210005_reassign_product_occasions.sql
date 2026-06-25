-- Reassign product_occasions to spread products across Wisuda / Ulang Tahun / Anniversary / Wedding
-- Keep many on Hadiah (generic gift) as catch-all

-- First, clear all existing product_occasions
delete from public.product_occasions;

-- Wisuda (id=1) — Thumbelina graduation-worthy bouquets (8)
insert into public.product_occasions (product_id, occasion_id) values
  (44, 1), (45, 1), (46, 1), (47, 1), (48, 1), (49, 1), (50, 1), (51, 1);

-- Ulang Tahun (id=2) — bright, fun birthday bouquets (6)
insert into public.product_occasions (product_id, occasion_id) values
  (16, 2), (18, 2), (23, 2), (24, 2), (25, 2), (12, 2);

-- Anniversary (id=3) — romantic, elegant (5)
insert into public.product_occasions (product_id, occasion_id) values
  (2, 3), (3, 3), (19, 3), (26, 3), (27, 3);

-- Wedding (id=4) — large, elegant (5)
insert into public.product_occasions (product_id, occasion_id) values
  (1, 4), (7, 4), (21, 4), (31, 4), (32, 4);

-- Hadiah (id=5) — remaining generic gifts (25)
insert into public.product_occasions (product_id, occasion_id) values
  (4, 5), (5, 5), (6, 5), (8, 5), (9, 5), (10, 5),
  (11, 5), (13, 5), (14, 5), (15, 5), (17, 5), (20, 5),
  (22, 5), (28, 5), (29, 5), (30, 5), (33, 5), (34, 5),
  (35, 5), (36, 5), (37, 5), (38, 5), (41, 5), (42, 5), (43, 5);
