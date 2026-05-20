-- Add logo_url column to festivals table for storing festival logos
ALTER TABLE public.festivals 
ADD COLUMN logo_url TEXT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.festivals.logo_url IS 'URL to the festival logo image stored in Supabase Storage';

-- Create the festival-assets storage bucket for storing festival logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('festival-assets', 'festival-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for the storage bucket
-- Allow public read access to all files in the festival-assets bucket
CREATE POLICY "Public read access for festival assets" ON storage.objects
FOR SELECT USING (bucket_id = 'festival-assets');

-- Allow authenticated users to insert files into festival-logos folder
CREATE POLICY "Allow authenticated users to upload festival logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'festival-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'festival-logos'
);

-- Allow authenticated users to update files they own in festival-logos folder  
CREATE POLICY "Allow users to update their festival logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'festival-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'festival-logos'
);

-- Allow authenticated users to delete files in festival-logos folder
CREATE POLICY "Allow users to delete festival logos" ON storage.objects  
FOR DELETE USING (
  bucket_id = 'festival-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'festival-logos'
);