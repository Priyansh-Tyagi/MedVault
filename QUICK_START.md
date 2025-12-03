# Quick Start Guide

## 🚀 Get Your Project Running in 5 Steps

### Step 1: Set Up Supabase Database
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `database/setup.sql`
4. Paste and **Run** it
5. Verify: Check that tables `medical_records`, `share_links`, and `access_logs` exist

### Step 2: Create Storage Bucket
1. In Supabase Dashboard, go to **Storage**
2. Click **"New bucket"**
3. Name: `medical-records` (exact name, case-sensitive)
4. **Uncheck** "Public bucket" (keep it private)
5. Click **"Create bucket"**

### Step 3: Set Storage Policies
1. Still in Storage, click on the `medical-records` bucket
2. Go to **Policies** tab
3. Click **"New Policy"** → **"For full customization"**
4. Copy and run these 3 policies:

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload their own medical records"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Read
CREATE POLICY "Users can read their own medical records"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Delete
CREATE POLICY "Users can delete their own medical records"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Configure Environment Variables
1. Create `.env` file in `medvault/` directory (if not exists)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

### Step 5: Run the App
```bash
cd medvault
npm install
npm run dev
```

## ✅ Test Your Setup

1. **Sign Up**: Create a new account
2. **Upload**: Upload a PDF or image file
3. **Share**: Create a share link
4. **QR Code**: Generate QR code for the link
5. **Access**: Open share link in incognito window

## 🐛 Troubleshooting

### "Table doesn't exist" error
→ Run `database/setup.sql` again

### "Bucket not found" error
→ Create storage bucket named exactly `medical-records`

### "Permission denied" on upload
→ Check storage policies are set correctly

### Files not showing up
→ Check browser console for errors
→ Verify RLS policies are enabled
→ Check that `user_id` matches authenticated user

## 📋 What's Working Now

✅ User authentication (email + Google)  
✅ File upload to Supabase Storage  
✅ File listing and search  
✅ Share link generation  
✅ QR code generation  
✅ Doctor viewer page  
✅ Access logging  

## 📚 Next Steps

See `ROADMAP.md` for:
- Testing checklist
- UI improvements
- New features to add
- Security enhancements

## 🆘 Need Help?

1. Check `database/README.md` for detailed database setup
2. Review `IMPLEMENTATION_SUMMARY.md` for what was built
3. Check browser console for error messages
4. Verify all environment variables are set

