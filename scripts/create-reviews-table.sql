-- =============================================
-- Puthic Sari — Tabel Reviews
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- =============================================

-- Buat tabel reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: siapa saja bisa BACA review yang sudah disetujui
CREATE POLICY "Public can read approved reviews"
  ON public.reviews
  FOR SELECT
  USING (is_approved = true);

-- Policy: siapa saja bisa SUBMIT review baru (status pending)
CREATE POLICY "Anyone can insert a review"
  ON public.reviews
  FOR INSERT
  WITH CHECK (is_approved = false);

-- Policy: admin bisa lakukan apa saja (update, delete, read semua)
CREATE POLICY "Admin full access"
  ON public.reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- SELESAI! Setelah jalankan ini, fitur reviews
-- sudah aktif di website dan admin dashboard.
-- =============================================
