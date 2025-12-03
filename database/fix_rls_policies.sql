-- Fix RLS Policies for Share Links
-- Run this if you're getting "new row violates row-level security policy" errors

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view their own share links" ON share_links;
DROP POLICY IF EXISTS "Users can create their own share links" ON share_links;
DROP POLICY IF EXISTS "Users can update their own share links" ON share_links;
DROP POLICY IF EXISTS "Users can delete their own share links" ON share_links;
DROP POLICY IF EXISTS "Public can read share links by token" ON share_links;

-- Recreate policies
CREATE POLICY "Users can view their own share links"
  ON share_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share links"
  ON share_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links"
  ON share_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links"
  ON share_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can read share links by token (for validation)
CREATE POLICY "Public can read share links by token"
  ON share_links
  FOR SELECT
  USING (true);

-- Verify policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'share_links'
ORDER BY policyname;

