-- Migration: customer_addresses table for authenticated saved addresses
-- Guest checkout remains one-time only; public address read/update is forbidden.
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  label        TEXT DEFAULT 'Rumah',
  full_name    TEXT,
  phone        TEXT,
  address_line TEXT NOT NULL,
  city         TEXT,
  postal_code  TEXT CHECK (char_length(postal_code) = 5),
  note         TEXT,
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_addresses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_customer_addresses_email
  ON public.customer_addresses (email);

-- Unique constraint: one default per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default
  ON public.customer_addresses (user_id)
  WHERE is_default = true;

-- RLS: saved addresses require authenticated ownership.
-- Guest checkout must remain one-time only or use a server-issued email verification token;
-- do not expose public address read/update by email.
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read customer_addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Allow public insert customer_addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Allow update customer_addresses by email" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can read own customer_addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can insert own customer_addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can update own customer_addresses" ON public.customer_addresses;

CREATE POLICY "Users can read own customer_addresses"
  ON public.customer_addresses
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own customer_addresses"
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own customer_addresses"
  ON public.customer_addresses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.customer_addresses FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_addresses TO authenticated;

-- Function: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trigger_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
