-- Fix TOTLMODELAGENCY-3B: StorageApiError "Bucket not found" on portfolio upload
--
-- Root cause: Production Supabase project may not have the portfolio bucket
-- (e.g. migrations applied out of order, or project created before portfolio migration).
-- This migration is idempotent: safe to run even if bucket already exists.
--
-- Sentry: https://the-digital-builders-bi.sentry.io/issues/TOTLMODELAGENCY-3B

-- Create portfolio storage bucket if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own portfolio images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
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
        WHERE schemaname = 'storage' AND tablename = 'objects' 
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
        WHERE schemaname = 'storage' AND tablename = 'objects' 
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
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Public can view all portfolio images'
    ) THEN
        CREATE POLICY "Public can view all portfolio images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'portfolio');
    END IF;
END $$;
