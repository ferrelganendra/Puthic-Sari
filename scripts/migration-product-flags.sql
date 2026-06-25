-- Migration: Add storefront product flags
-- Run this in Supabase SQL Editor if your products table already exists.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;

UPDATE products SET is_best_seller = false WHERE is_best_seller IS NULL;
UPDATE products SET is_sold_out = false WHERE is_sold_out IS NULL;

