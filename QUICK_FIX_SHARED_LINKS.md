# Quick Fix: Shared Links Showing "No Records Found"

## The Problem

Shared links are showing "No records found" even though:
- The share link is valid
- Records exist in the database
- Download/view works when logged in

## Root Cause

The database function `get_shared_medical_records` hasn't been created yet. This function is needed to bypass RLS (Row Level Security) when accessing records via share links.

## Solution (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **"New query"**

### Step 2: Run the SQL Script

1. Open the file: `database/fix_shared_records_access.sql`
2. **Copy the entire contents** (all 99 lines)
3. **Paste into Supabase SQL Editor**
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify It Worked

You should see:
- ✅ "Success. No rows returned" (this is normal - the function was created)

### Step 4: Test

1. Create a new share link in your dashboard
2. Copy the share URL
3. Open it in an **incognito/private window** (to test as unauthenticated user)
4. You should now see the records!

## What This Does

The SQL script creates a function `get_shared_medical_records()` that:
- ✅ Validates the share token
- ✅ Bypasses RLS using `SECURITY DEFINER`
- ✅ Returns medical records for the share link owner
- ✅ Increments the use count
- ✅ Works for unauthenticated users (public access)

## Still Not Working?

### Check 1: Function Exists

Run this in SQL Editor:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_shared_medical_records';
```

Should return: `get_shared_medical_records`

### Check 2: Test the Function

Run this (replace `YOUR_TOKEN` with an actual token):

```sql
SELECT * FROM get_shared_medical_records('YOUR_TOKEN');
```

Should return the records.

### Check 3: Check Browser Console

Open browser DevTools (F12) → Console tab
Look for error messages that might indicate:
- RPC function doesn't exist
- RLS blocking access
- Invalid token

### Check 4: Verify Share Link is Valid

1. Go to your dashboard
2. Check the share links list
3. Make sure the link hasn't expired
4. Check use count hasn't exceeded max uses

## Alternative: RLS Policy (If Function Doesn't Work)

If the function approach doesn't work, you can add this RLS policy instead:

```sql
-- Allow reading medical_records via valid share links
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

