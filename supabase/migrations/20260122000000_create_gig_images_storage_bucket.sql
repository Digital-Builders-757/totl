-- Create gig-images storage bucket (public for displaying gig cover images)
-- 
-- SECURITY NOTE: Bucket is PUBLIC by design because:
-- 1. Gig listings are public-facing marketing assets
-- 2. Images are meant to be displayed on public gig listing pages
-- 3. No sensitive data is stored in gig images
-- 4. RLS policies still enforce: users can only upload/delete their own images
--
-- If gig images need to be private in the future, change to private bucket
-- and use signed URLs instead of public URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('gig-images', 'gig-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload gig images
-- Path structure: {user_id}/gig-{gig_id}-{timestamp}.{ext}
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload gig images'
    ) THEN
        CREATE POLICY "Users can upload gig images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'gig-images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow authenticated users to update their own gig images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can update their own gig images'
    ) THEN
        CREATE POLICY "Users can update their own gig images"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'gig-images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'gig-images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow authenticated users to delete their own gig images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete their own gig images'
    ) THEN
        CREATE POLICY "Users can delete their own gig images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'gig-images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Allow public read access to all gig images (since bucket is public)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public can view all gig images'
    ) THEN
        CREATE POLICY "Public can view all gig images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'gig-images');
    END IF;
END $$;
