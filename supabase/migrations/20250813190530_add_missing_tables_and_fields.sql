-- =====================================================
-- TOTL Agency - Add Missing Tables and Fields
-- =====================================================
-- Date: 2025-08-13
-- Purpose: Add missing tables and fields that the code expects

BEGIN;

-- =====================================================
-- 1. ADD MISSING FIELDS TO EXISTING TABLES
-- =====================================================

-- Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add missing fields to talent_profiles table
ALTER TABLE talent_profiles 
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS weight INTEGER;

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status booking_status NOT NULL DEFAULT 'pending',
    compensation NUMERIC,
    notes TEXT,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR NEW TABLES
-- =====================================================

-- Bookings indexes
CREATE INDEX IF NOT EXISTS bookings_gig_id_idx ON bookings(gig_id);
CREATE INDEX IF NOT EXISTS bookings_talent_id_idx ON bookings(talent_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

-- Portfolio items indexes
CREATE INDEX IF NOT EXISTS portfolio_items_talent_id_idx ON portfolio_items(talent_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Bookings policies
CREATE POLICY "Bookings view policy" ON bookings FOR SELECT TO public USING (true);
CREATE POLICY "Update own bookings" ON bookings FOR UPDATE TO authenticated 
USING (talent_id = auth.uid() OR gig_id IN (
    SELECT id FROM gigs WHERE client_id = auth.uid()
));
CREATE POLICY "Insert own bookings" ON bookings FOR INSERT TO authenticated 
WITH CHECK (talent_id = auth.uid());

-- Portfolio items policies
CREATE POLICY "Portfolio items view policy" ON portfolio_items FOR SELECT TO public USING (true);
CREATE POLICY "Update own portfolio items" ON portfolio_items FOR UPDATE TO authenticated 
USING (talent_id = auth.uid());
CREATE POLICY "Insert own portfolio items" ON portfolio_items FOR INSERT TO authenticated 
WITH CHECK (talent_id = auth.uid());

-- =====================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Bookings updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- Portfolio items updated_at trigger
CREATE OR REPLACE FUNCTION update_portfolio_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_items_updated_at();

COMMIT;
