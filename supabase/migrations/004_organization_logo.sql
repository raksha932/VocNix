-- ====================================================================
-- VocNix Migration: Organization Logo Support & Supabase Storage Bucket
-- ====================================================================

-- 1. Add logo_url column to organizations table
ALTER TABLE IF EXISTS public.organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.organizations.logo_url IS 'Public URL or storage path of the official organization logo';

-- 2. Create public storage bucket for organization logos if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- 3. Row Level Security (RLS) for Storage Objects
-- Allow public viewing of all organization logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Access for Organization Logos'
  ) THEN
    CREATE POLICY "Public Access for Organization Logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'organization-logos');
  END IF;
END $$;

-- Allow authenticated users (Super Admin & Org Admins) to upload logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated Upload for Organization Logos'
  ) THEN
    CREATE POLICY "Authenticated Upload for Organization Logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'organization-logos' 
      AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );
  END IF;
END $$;

-- Allow authenticated users to update their uploaded logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated Update for Organization Logos'
  ) THEN
    CREATE POLICY "Authenticated Update for Organization Logos"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'organization-logos' 
      AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );
  END IF;
END $$;

-- Allow authenticated users to delete their organization logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated Delete for Organization Logos'
  ) THEN
    CREATE POLICY "Authenticated Delete for Organization Logos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'organization-logos' 
      AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    );
  END IF;
END $$;
