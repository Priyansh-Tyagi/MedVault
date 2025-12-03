# Fixing "Bucket not found" Error

## The Problem

You're getting a 404 "Bucket not found" error when trying to download files. This happens because:

1. **Storage bucket doesn't exist** - The bucket `medical-records` hasn't been created
2. **Using public URLs on private bucket** - The bucket is private, so `public_url` doesn't work
3. **Need signed URLs** - Private buckets require signed URLs for access

## Solution

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `medical-records` (exact name, case-sensitive)
4. **Uncheck** "Public bucket" (keep it private)
5. Click **"Create bucket"**

### Step 2: Set Storage Policies

Go to **Storage** → **Policies** → Select `medical-records` bucket

Add these policies:

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

### Step 3: Verify Bucket Exists

In Supabase SQL Editor, run:

```sql
SELECT name, public FROM storage.buckets WHERE name = 'medical-records';
```

Should return: `medical-records | false` (false = private)

## What I Fixed in Code

1. **Download now uses `storage_path`** instead of `public_url`
2. **Uses signed URLs** for private bucket access
3. **Added file viewer** with preview for PDFs and images
4. **Better error handling** for missing files

## Testing

1. **Upload a file** - Should work if bucket exists
2. **Click "View" button** - Should show preview (PDF/image)
3. **Click "Download"** - Should download using signed URL
4. **Click "Open in new tab"** - Should open with signed URL

## Common Issues

### "Bucket not found" error
→ Create the bucket (Step 1 above)

### "Permission denied" on download
→ Set storage policies (Step 2 above)

### Files upload but can't view/download
→ Check bucket name is exactly `medical-records`
→ Verify policies are set correctly

