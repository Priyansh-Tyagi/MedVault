# Fixing "No Records Found" on Shared View Page

## The Problem

When accessing a share link, the page shows "No records found" even though:
- The share link is valid
- Records exist in the database
- The token validation works

## Root Cause

The issue is **Row Level Security (RLS)** blocking access to `medical_records`:
- Share links are accessed by **unauthenticated users** (public access)
- RLS policy on `medical_records` only allows: `auth.uid() = user_id`
- When not logged in, `auth.uid()` is `null`, so the query returns empty

## Solution

You have **two options**:

### Option 1: Database Function (Recommended - More Secure)

Run this SQL in Supabase SQL Editor:

```sql
-- Copy and run: database/fix_shared_records_access.sql
```

This creates a function `get_shared_medical_records()` that:
- Validates the share token
- Bypasses RLS using `SECURITY DEFINER`
- Returns the medical records for that user
- Increments the use count

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `database/fix_shared_records_access.sql`
3. Paste and run it
4. Refresh your shared view page

### Option 2: RLS Policy (Simpler - Less Secure)

Add this RLS policy to allow reading via share links:

```sql
CREATE POLICY "Allow read via valid share link"
ON medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM share_links
    WHERE share_links.user_id = medical_records.user_id
    AND share_links.expires_at > NOW()
    AND (share_links.max_uses IS NULL OR share_links.use_count < share_links.max_uses)
  )
);
```

**Note:** This is less secure because it allows reading records if ANY valid share link exists for that user, not just the specific token being used.

## Verification

After running the fix:

1. **Create a share link** in your dashboard
2. **Copy the share URL**
3. **Open it in an incognito/private window** (to test as unauthenticated user)
4. **You should see the records**

## Debugging

If it still doesn't work:

1. **Check browser console** for errors
2. **Check Supabase logs** (Dashboard → Logs)
3. **Verify the function exists:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'get_shared_medical_records';
   ```
4. **Test the function directly:**
   ```sql
   SELECT * FROM get_shared_medical_records('your-token-here');
   ```

## What Changed in Code

The `getSharedRecords` function now:
- Tries to use the RPC function first (if it exists)
- Falls back to direct query if RPC fails
- Provides better error messages


