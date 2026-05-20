-- Fix festival-assets storage RLS: drop permissive write policies that allowed
-- any authenticated user to upload/update/delete festival logos.
-- Postgres ORs permissive policies together, so these bypassed the intended
-- admin-only restriction added by "Admins can ... festival assets".

DROP POLICY IF EXISTS "Allow authenticated users to upload festival logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their festival logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete festival logos" ON storage.objects;
