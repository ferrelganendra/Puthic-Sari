-- Create subscribers table for newsletter email capture
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS public.subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'footer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on lowercase email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_lower_unique
  ON public.subscribers ((lower(email)));

-- Index for active subscriber lookups
CREATE INDEX IF NOT EXISTS subscribers_active_email_idx
  ON public.subscribers ((lower(email)))
  WHERE is_active = true;

-- RLS: anon can insert, cannot select/update/delete
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "admin read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "admin update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "admin delete subscribers" ON public.subscribers;

-- Anonymous and authenticated users can insert (subscribe)
CREATE POLICY "anon insert subscribers" ON public.subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin can read all subscribers
CREATE POLICY "admin read subscribers" ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can update subscribers
CREATE POLICY "admin update subscribers" ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can delete subscribers
CREATE POLICY "admin delete subscribers" ON public.subscribers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscribers_set_updated_at ON public.subscribers;
CREATE TRIGGER subscribers_set_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscribers_updated_at();
