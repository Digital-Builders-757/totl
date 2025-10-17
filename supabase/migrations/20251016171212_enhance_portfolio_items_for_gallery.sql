-- =====================================================
-- TOTL Agency - Enhance Portfolio Items for Gallery
-- =====================================================
-- Date: 2025-10-16
-- Purpose: Add fields for portfolio gallery system with ordering, primary images, and storage paths

BEGIN;

-- =====================================================
-- 1. ADD NEW FIELDS TO portfolio_items TABLE
-- =====================================================

-- Add image_path for Supabase Storage (like avatar_path)
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add display_order for reordering portfolio items
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_primary to mark featured/primary portfolio image
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- =====================================================
-- 2. CREATE INDEX FOR ORDERING
-- =====================================================

-- Index for efficient ordering queries
CREATE INDEX IF NOT EXISTS portfolio_items_talent_order_idx 
ON portfolio_items(talent_id, display_order);

-- Index for finding primary images quickly
CREATE INDEX IF NOT EXISTS portfolio_items_is_primary_idx 
ON portfolio_items(talent_id, is_primary) 
WHERE is_primary = true;

-- =====================================================
-- 3. CREATE STORAGE BUCKET FOR PORTFOLIO IMAGES
-- =====================================================

-- Create portfolio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. SET UP STORAGE POLICIES FOR PORTFOLIO BUCKET
-- =====================================================

-- Policy: Allow authenticated users to upload their own portfolio images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload their own portfolio images'
    ) THEN
        CREATE POLICY "Users can upload their own portfolio images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'portfolio' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow authenticated users to update their own portfolio images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can update their own portfolio images'
    ) THEN
        CREATE POLICY "Users can update their own portfolio images"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'portfolio' AND
            (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'portfolio' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow authenticated users to delete their own portfolio images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete their own portfolio images'
    ) THEN
        CREATE POLICY "Users can delete their own portfolio images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'portfolio' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow public read access to all portfolio images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public can view all portfolio images'
    ) THEN
        CREATE POLICY "Public can view all portfolio images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'portfolio');
    END IF;
END $$;

-- =====================================================
-- 5. ADD DELETE POLICY FOR PORTFOLIO ITEMS
-- =====================================================

-- Allow talent to delete their own portfolio items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'portfolio_items' 
        AND policyname = 'Delete own portfolio items'
    ) THEN
        CREATE POLICY "Delete own portfolio items" 
        ON portfolio_items FOR DELETE 
        TO authenticated 
        USING (talent_id = auth.uid());
    END IF;
END $$;

-- =====================================================
-- 6. CREATE HELPER FUNCTION TO SET PRIMARY IMAGE
-- =====================================================

-- Function to ensure only one primary image per talent
CREATE OR REPLACE FUNCTION set_portfolio_primary(
    p_portfolio_item_id UUID,
    p_talent_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify the item belongs to the talent
    IF NOT EXISTS (
        SELECT 1 FROM portfolio_items 
        WHERE id = p_portfolio_item_id 
        AND talent_id = p_talent_id
    ) THEN
        RAISE EXCEPTION 'Portfolio item not found or access denied';
    END IF;

    -- Remove primary status from all other items for this talent
    UPDATE portfolio_items 
    SET is_primary = false 
    WHERE talent_id = p_talent_id;
    
    -- Set the specified item as primary
    UPDATE portfolio_items 
    SET is_primary = true 
    WHERE id = p_portfolio_item_id 
    AND talent_id = p_talent_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_portfolio_primary(UUID, UUID) TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION set_portfolio_primary(UUID, UUID) IS 
'Set a portfolio item as primary/featured, automatically removing primary status from other items';

COMMIT;

