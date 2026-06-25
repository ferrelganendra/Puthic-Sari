-- =============================================
-- Puthic Sari — Tambah Kolom is_new_arrival + 11 Produk Baru
-- FIXED: images pakai format jsonb, bukan ARRAY[]
-- =============================================

-- 1. Tambah kolom is_new_arrival ke tabel products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;

-- =============================================
-- 2. Insert 11 produk baru (images format jsonb)
-- =============================================

INSERT INTO public.products (name, description, price, category, images, is_active, is_best_seller, is_sold_out, is_new_arrival)
VALUES

(
  'Korean Bouquet Gerbera',
  'Buket gaya Korean aesthetic dengan gerbera cantik. Cocok untuk wisuda dan hadiah.',
  285000,
  'Gerbera',
  '["/product-photos/Korean Bouquet Gerbera/WhatsApp Image 2026-06-02 at 10.55.09.jpeg", "/product-photos/Korean Bouquet Gerbera/WhatsApp Image 2026-06-02 at 10.55.09 (1).jpeg", "/product-photos/Korean Bouquet Gerbera/WhatsApp Image 2026-06-02 at 10.55.10.jpeg", "/product-photos/Korean Bouquet Gerbera/WhatsApp Image 2026-06-02 at 10.55.10 (1).jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Lily Round',
  'Buket lily bulat yang elegan dengan tampilan premium dan unik.',
  320000,
  'Lily',
  '["/product-photos/Lily Round/WhatsApp Image 2026-06-02 at 11.39.01.jpeg", "/product-photos/Lily Round/WhatsApp Image 2026-06-02 at 11.39.01 (1).jpeg", "/product-photos/Lily Round/WhatsApp Image 2026-06-02 at 11.39.02.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Sunflowers Gerbera',
  'Kombinasi sunflower dan gerbera yang cerah dan penuh semangat.',
  260000,
  'Gerbera',
  '["/product-photos/Sunflowers Gerbera/WhatsApp Image 2026-06-03 at 09.46.36.jpeg", "/product-photos/Sunflowers Gerbera/WhatsApp Image 2026-06-03 at 09.46.36 (1).jpeg", "/product-photos/Sunflowers Gerbera/WhatsApp Image 2026-06-03 at 09.46.37.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Lily Daisy',
  'Thumbelina dengan kombinasi lily dan daisy yang manis dan segar.',
  310000,
  'Thumbelina',
  '["/product-photos/Thumbelina Lily Daisy/WhatsApp Image 2026-06-02 at 11.59.45.jpeg", "/product-photos/Thumbelina Lily Daisy/WhatsApp Image 2026-06-02 at 11.59.45 (1).jpeg", "/product-photos/Thumbelina Lily Daisy/WhatsApp Image 2026-06-02 at 11.59.45 (2).jpeg", "/product-photos/Thumbelina Lily Daisy/WhatsApp Image 2026-06-02 at 11.59.46.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Lily Jumbo',
  'Thumbelina lily ukuran jumbo yang megah untuk momen istimewa.',
  520000,
  'Thumbelina',
  '["/product-photos/Thumbelina Lily Jumbo/WhatsApp Image 2026-06-02 at 12.01.43.jpeg", "/product-photos/Thumbelina Lily Jumbo/WhatsApp Image 2026-06-02 at 12.01.43 (1).jpeg", "/product-photos/Thumbelina Lily Jumbo/WhatsApp Image 2026-06-02 at 12.01.44.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Lily Jumbo Pink',
  'Thumbelina lily jumbo bernuansa pink yang romantis dan memukau.',
  480000,
  'Thumbelina',
  '["/product-photos/Thumbelina Lily Jumbo Pink/WhatsApp Image 2026-06-02 at 10.50.04.jpeg", "/product-photos/Thumbelina Lily Jumbo Pink/WhatsApp Image 2026-06-02 at 10.50.06.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Old Paper Bloom',
  'Thumbelina dengan wrapping old paper yang vintage dan penuh pesona.',
  340000,
  'Thumbelina',
  '["/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.13.jpeg", "/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.13 (1).jpeg", "/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.14.jpeg", "/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.14 (1).jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Old Paper Gunny',
  'Thumbelina dalam balutan old paper dan goni yang natural dan unik.',
  355000,
  'Thumbelina',
  '["/product-photos/Thumbelina Old Paper Gunny/WhatsApp Image 2026-06-02 at 11.43.29.jpeg", "/product-photos/Thumbelina Old Paper Gunny/WhatsApp Image 2026-06-02 at 11.43.29 (1).jpeg", "/product-photos/Thumbelina Old Paper Gunny/WhatsApp Image 2026-06-02 at 11.43.30.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Rose',
  'Thumbelina dengan sentuhan rose yang romantis dan elegan.',
  375000,
  'Thumbelina',
  '["/product-photos/Thumbelina Rose/WhatsApp Image 2026-06-03 at 09.46.31.jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Sunshine Bloom',
  'Thumbelina dengan nuansa sunshine yang hangat dan penuh semangat.',
  295000,
  'Thumbelina',
  '["/product-photos/Thumbelina Sunshine Bloom/WhatsApp Image 2026-06-02 at 11.58.01.jpeg", "/product-photos/Thumbelina Sunshine Bloom/WhatsApp Image 2026-06-02 at 11.58.01 (1).jpeg"]'::jsonb,
  true, false, false, true
),

(
  'Thumbelina Yellow Rose Small',
  'Thumbelina dengan yellow rose ukuran small yang manis dan terjangkau.',
  220000,
  'Thumbelina',
  '["/product-photos/Thumbelina Yellow Rose Small/WhatsApp Image 2026-06-03 at 09.46.32.jpeg", "/product-photos/Thumbelina Yellow Rose Small/WhatsApp Image 2026-06-03 at 09.46.33.jpeg", "/product-photos/Thumbelina Yellow Rose Small/WhatsApp Image 2026-06-03 at 09.46.33 (1).jpeg", "/product-photos/Thumbelina Yellow Rose Small/WhatsApp Image 2026-06-03 at 09.46.34.jpeg", "/product-photos/Thumbelina Yellow Rose Small/WhatsApp Image 2026-06-03 at 09.46.35.jpeg"]'::jsonb,
  true, false, false, true
);

-- =============================================
-- SELESAI! 11 produk baru berhasil ditambahkan.
-- =============================================
