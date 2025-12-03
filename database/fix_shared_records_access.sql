-- Fix Shared Records Access
-- This creates a function that allows reading medical_records via share links
-- Run this in Supabase SQL Editor

-- Create a function to get shared medical records
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION get_shared_medical_records(share_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  public_url TEXT,
  record_type TEXT,
  record_date TIMESTAMPTZ,
  provider_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  share_link_record RECORD;
BEGIN
  -- Validate the share token
  SELECT * INTO share_link_record
  FROM share_links
  WHERE token = share_token
    AND expires_at > NOW()
    AND (max_uses IS NULL OR use_count < max_uses);

  -- If token is invalid, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check max uses if set
  IF share_link_record.max_uses IS NOT NULL AND share_link_record.use_count >= share_link_record.max_uses THEN
    RETURN;
  END IF;

  -- Increment use count
  UPDATE share_links
  SET use_count = use_count + 1
  WHERE id = share_link_record.id;

  -- Return the medical records for this user
  RETURN QUERY
  SELECT 
    mr.id,
    mr.user_id,
    mr.file_name,
    mr.file_type,
    mr.file_size,
    mr.storage_path,
    mr.public_url,
    mr.record_type,
    mr.record_date,
    mr.provider_name,
    mr.notes,
    mr.created_at,
    mr.updated_at
  FROM medical_records mr
  WHERE mr.user_id = share_link_record.user_id
  ORDER BY mr.record_date DESC NULLS LAST, mr.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_shared_medical_records(TEXT) TO anon, authenticated;

-- ============================================
-- ALTERNATIVE: RLS Policy Approach (Simpler)
-- ============================================
-- If the function doesn't work, you can use this RLS policy instead.
-- This allows reading medical_records when there's a valid share link.
-- However, this is less secure as it doesn't validate the specific token.

-- DROP POLICY IF EXISTS "Allow read via valid share link" ON medical_records;
-- CREATE POLICY "Allow read via valid share link"
-- ON medical_records
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM share_links
--     WHERE share_links.user_id = medical_records.user_id
--     AND share_links.expires_at > NOW()
--     AND (share_links.max_uses IS NULL OR share_links.use_count < share_links.max_uses)
--   )
-- );

-- Note: The function approach (above) is more secure as it validates the specific token
-- The RLS policy approach is simpler but allows reading any records if ANY valid share link exists for that user

