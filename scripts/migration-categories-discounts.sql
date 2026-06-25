-- Migration: Add categories and discounts tables
-- Run this in Supabase SQL Editor

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '🌸',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add category_id and discount_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_id INTEGER REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;

-- 4. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- 5. Policies - public read, authenticated write
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read discounts" ON discounts FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage discounts" ON discounts FOR ALL USING (auth.role() = 'authenticated');

-- 6. Seed some default categories
INSERT INTO categories (name, emoji, description) VALUES
  ('Buket Wisuda', '🎓', 'Buket bunga untuk acara wisuda'),
  ('Buket Anniversary', '💕', 'Buket bunga untuk anniversary'),
  ('Buket Birthday', '🎂', 'Buket bunga untuk ulang tahun'),
  ('Buket Artificial', '🌺', 'Buket bunga artificial premium'),
  ('Buket Fresh', '🌷', 'Buket bunga segar'),
  ('Bucket Custom', '✨', 'Buket custom sesuai request')
ON CONFLICT (name) DO NOTHING;
