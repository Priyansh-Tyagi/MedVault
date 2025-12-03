-- Fix Storage Access for Shared Links
-- This allows unauthenticated users to access files via share links
-- Run this in Supabase SQL Editor

-- ============================================
-- Option 1: Allow reading files via share links (Recommended)
-- ============================================
-- This policy allows reading files if there's a valid share link for that user

-- First, create a function to check if a file can be accessed via share link
CREATE OR REPLACE FUNCTION can_access_via_share_link(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_from_path TEXT;
  has_valid_share BOOLEAN;
BEGIN
  -- Extract user_id from file path (format: user_id/timestamp_random.ext)
  user_id_from_path := (string_to_array(file_path, '/'))[1];
  
  -- Check if there's a valid share link for this user
  SELECT EXISTS (
    SELECT 1 FROM share_links
    WHERE share_links.user_id::text = user_id_from_path
    AND share_links.expires_at > NOW()
    AND (share_links.max_uses IS NULL OR share_links.use_count < share_links.max_uses)
  ) INTO has_valid_share;
  
  RETURN has_valid_share;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_access_via_share_link(TEXT) TO anon, authenticated;

-- Create storage policy to allow reading via share links
-- Note: This is a simplified approach - it allows reading if ANY valid share link exists for that user
-- For more security, you'd need to validate the specific token, which requires Edge Functions
CREATE POLICY "Allow read via share links"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND
  can_access_via_share_link(name)
);

-- ============================================
-- Alternative: Make bucket public (NOT RECOMMENDED for production)
-- ============================================
-- Only use this if you want all files to be publicly accessible
-- This is NOT secure and should only be used for testing

-- UPDATE storage.buckets SET public = true WHERE name = 'medical-records';

-- ============================================
-- Better Alternative: Use Edge Function for Signed URLs
-- ============================================
-- For production, create a Supabase Edge Function that:
-- 1. Validates the share token
-- 2. Generates a signed URL using service role
-- 3. Returns the signed URL
--
-- This is more secure but requires setting up Edge Functions
-- See: https://supabase.com/docs/guides/functions

