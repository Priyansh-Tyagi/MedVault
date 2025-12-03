# Fix: Shared Links - View, Download, Open Not Working

## The Problem

When accessing a shared link (as an unauthenticated user):
- ❌ View button doesn't work
- ❌ Download button doesn't work  
- ❌ Open in new tab doesn't work

## Root Cause

**Signed URLs require authentication**, but shared links are accessed by **unauthenticated users**. The storage policies only allow authenticated users to read files.

## Solution

You need to **allow unauthenticated users to read files via share links**. Here are two options:

---

## Option 1: Storage Policy (Recommended - Quick Fix)

This allows reading files if there's a valid share link for that user.

### Step 1: Run SQL Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open `database/fix_storage_shared_access.sql`
3. **Copy all contents** and paste into SQL Editor
4. Click **"Run"**

This will:
- ✅ Create a function `can_access_via_share_link()` that checks for valid share links
- ✅ Create a storage policy that allows reading files via share links
- ✅ Work for unauthenticated users

### Step 2: Test

1. Create a share link in your dashboard
2. Open it in an **incognito window**
3. Try View, Download, and Open in new tab
4. Should work now! ✅

---

## Option 2: Make Bucket Public (NOT RECOMMENDED)

**Only use for testing!** This makes all files publicly accessible.

1. Go to **Supabase Dashboard** → **Storage**
2. Click on `medical-records` bucket
3. Click **"Make public"** or toggle the public setting

**⚠️ Warning:** This makes ALL files publicly accessible. Anyone with a file URL can access it. Only use for testing!

---

## What Changed in Code

I updated the code to:
1. **Handle unauthenticated users** - Tries public URL first, then signed URL
2. **Better download logic** - Uses fetch for unauthenticated users
3. **Better error messages** - Shows what went wrong

---

## Verification

After running the SQL:

1. **Check storage policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname = 'Allow read via share links';
   ```

2. **Test the function:**
   ```sql
   SELECT can_access_via_share_link('user-id-here/timestamp_file.pdf');
   ```

3. **Test in browser:**
   - Open share link in incognito
   - Click View → Should show preview
   - Click Download → Should download
   - Click Open in new tab → Should open

---

## Still Not Working?

### Check 1: Storage Bucket Exists

```sql
SELECT name, public FROM storage.buckets WHERE name = 'medical-records';
```

Should return: `medical-records | false`

### Check 2: Storage Policies Applied

Go to **Storage** → **Policies** → Select `medical-records` bucket

You should see:
- ✅ "Allow read via share links" policy

### Check 3: Function Exists

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'can_access_via_share_link';
```

Should return: `can_access_via_share_link`

### Check 4: Browser Console

Open DevTools (F12) → Console tab
Look for errors like:
- "File access requires authentication"
- "Failed to download file"
- "Error creating signed URL"

---

## Production Recommendation

For production, consider using **Supabase Edge Functions** to:
1. Validate the share token
2. Generate signed URLs server-side using service role
3. Return the signed URL to the client

This is more secure but requires additional setup.

