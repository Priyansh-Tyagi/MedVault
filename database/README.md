# Database Setup Guide

## Quick Start

1. **Open Supabase Dashboard** → Go to your project → SQL Editor

2. **Run the setup script**: Copy and paste the contents of `setup.sql` into the SQL Editor and execute it.

3. **Create Storage Bucket**:
   - Go to Storage in Supabase Dashboard
   - Click "New bucket"
   - Name: `medical-records`
   - Public: **No** (uncheck this)
   - Click "Create bucket"

4. **Set Storage Policies**:
   - Go to Storage → Policies
   - Select the `medical-records` bucket
   - Add these policies (or run the SQL commands from `setup.sql`):

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own medical records"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own medical records"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own medical records"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Database Schema

### Tables

1. **medical_records** - Stores file metadata
   - `id` (UUID) - Primary key
   - `user_id` (UUID) - Foreign key to auth.users
   - `file_name`, `file_type`, `file_size` - File info
   - `storage_path`, `public_url` - Storage references
   - `record_type`, `record_date`, `provider_name`, `notes` - Medical record metadata

2. **share_links** - Manages shareable links
   - `id` (UUID) - Primary key
   - `user_id` (UUID) - Owner of the share link
   - `token` (TEXT) - Unique share token
   - `expires_at` (TIMESTAMPTZ) - Expiration date
   - `max_uses` (INTEGER) - Optional usage limit
   - `use_count` (INTEGER) - Current usage count

3. **access_logs** - Audit trail for shared record access
   - `id` (UUID) - Primary key
   - `share_link_id` (UUID) - Which share link was used
   - `record_id` (UUID) - Which record was accessed
   - `accessed_at` (TIMESTAMPTZ) - When access occurred
   - `ip_address`, `user_agent`, `accessor_name` - Accessor info

## Security (RLS Policies)

All tables have Row Level Security (RLS) enabled:

- **medical_records**: Users can only access their own records
- **share_links**: Users can manage their own share links
- **access_logs**: Users can view logs for their own share links; system can insert logs

## Storage Setup

The storage bucket `medical-records` stores actual files:
- Files are organized by user ID: `{user_id}/{timestamp}_{random}.{ext}`
- Only authenticated users can upload/read/delete their own files
- Shared access is handled via signed URLs (not public URLs)

## Verification

After setup, verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('medical_records', 'share_links', 'access_logs');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('medical_records', 'share_links', 'access_logs');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

