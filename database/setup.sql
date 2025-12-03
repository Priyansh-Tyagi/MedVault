-- ============================================
-- MedVault Database Setup
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MEDICAL_RECORDS TABLE
-- Stores metadata for uploaded medical files
-- ============================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  record_type TEXT DEFAULT 'document',
  record_date TIMESTAMPTZ DEFAULT NOW(),
  provider_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON medical_records(record_date DESC);

-- ============================================
-- 2. SHARE_LINKS TABLE
-- Manages shareable links with expiration and usage limits
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for share_links
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);

-- ============================================
-- 3. ACCESS_LOGS TABLE
-- Logs who accessed shared records (for security/audit)
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  accessor_name TEXT DEFAULT 'Unknown'
);

-- Indexes for access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_share_link_id ON access_logs(share_link_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_record_id ON access_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at DESC);

-- ============================================
-- 4. UPDATE TRIGGERS
-- Automatically update updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MEDICAL_RECORDS POLICIES
-- ============================================

-- Users can only see their own records
CREATE POLICY "Users can view their own medical records"
  ON medical_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert their own medical records"
  ON medical_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update their own medical records"
  ON medical_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete their own medical records"
  ON medical_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SHARE_LINKS POLICIES
-- ============================================

-- Users can view their own share links
CREATE POLICY "Users can view their own share links"
  ON share_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own share links
CREATE POLICY "Users can create their own share links"
  ON share_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own share links
CREATE POLICY "Users can update their own share links"
  ON share_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own share links
CREATE POLICY "Users can delete their own share links"
  ON share_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can read share links by token (for validation)
-- This allows the share service to validate tokens without authentication
CREATE POLICY "Public can read share links by token"
  ON share_links
  FOR SELECT
  USING (true); -- Note: In production, you might want to restrict this further

-- ============================================
-- ACCESS_LOGS POLICIES
-- ============================================

-- Users can view access logs for their own share links
CREATE POLICY "Users can view access logs for their share links"
  ON access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.id = access_logs.share_link_id
      AND share_links.user_id = auth.uid()
    )
  );

-- System can insert access logs (for share link access)
-- This allows logging when someone accesses via a share link
CREATE POLICY "System can insert access logs"
  ON access_logs
  FOR INSERT
  WITH CHECK (true); -- Allow inserts for logging purposes

-- ============================================
-- STORAGE BUCKET SETUP
-- Note: Run this in Supabase Dashboard > Storage
-- ============================================

-- Create storage bucket for medical records
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('medical-records', 'medical-records', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies (run these after creating the bucket)
-- These allow users to upload/download their own files

-- Allow authenticated users to upload to their own folder
-- CREATE POLICY "Users can upload their own medical records"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'medical-records' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow users to read their own files
-- CREATE POLICY "Users can read their own medical records"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'medical-records' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow users to delete their own files
-- CREATE POLICY "Users can delete their own medical records"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'medical-records' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow public read access for shared records (via signed URLs)
-- This is handled by Supabase's signed URL system, not RLS

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's total storage used
CREATE OR REPLACE FUNCTION get_user_storage_used(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(file_size), 0)
    FROM medical_records
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if share link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(link_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM share_links
    WHERE token = link_token
    AND expires_at > NOW()
    AND (max_uses IS NULL OR use_count < max_uses)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE medical_records IS 'Stores metadata for uploaded medical record files';
COMMENT ON TABLE share_links IS 'Manages shareable links with expiration and usage limits';
COMMENT ON TABLE access_logs IS 'Logs access to shared records for security and audit purposes';

COMMENT ON COLUMN medical_records.record_type IS 'Type of medical record (e.g., lab_result, prescription, xray)';
COMMENT ON COLUMN share_links.max_uses IS 'Maximum number of times the link can be used (NULL = unlimited)';
COMMENT ON COLUMN access_logs.accessor_name IS 'Name or identifier of the person accessing the record';

