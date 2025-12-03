# Fixing 401 Unauthorized Errors

## What is a 401 Error?

A 401 error means "Unauthorized" - the server is rejecting your request because you don't have permission. In Supabase, this usually means:

1. **Not logged in** - No authentication session
2. **RLS policies blocking** - Row Level Security is preventing access
3. **Wrong user ID** - The user_id doesn't match
4. **Database not set up** - Tables or policies don't exist

## Quick Fixes

### 1. Check if You're Logged In

Open browser console (F12) and run:

```javascript
// Check current user
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
```

**If session is null:**
- You're not logged in
- Try logging in again
- Check if login is working

### 2. Check Database Setup

Make sure you've run the database setup:

1. Go to Supabase Dashboard → SQL Editor
2. Run `database/setup.sql`
3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('medical_records', 'share_links', 'access_logs');
   ```

### 3. Check RLS Policies

Verify RLS policies are enabled and correct:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'medical_records';

-- Should return: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'medical_records';
```

### 4. Test RLS Policies

Try this in Supabase SQL Editor (while logged in as your user):

```sql
-- This should work if RLS is set up correctly
SELECT * FROM medical_records 
WHERE user_id = auth.uid();
```

If this fails, your RLS policies need to be fixed.

## Common Causes

### Cause 1: Not Logged In
**Symptom:** 401 error when accessing dashboard
**Fix:** 
- Make sure you're logged in
- Check browser console for session
- Try logging out and back in

### Cause 2: RLS Policies Missing
**Symptom:** 401 error when fetching files
**Fix:**
- Run `database/setup.sql` again
- Make sure all policies are created
- Check Supabase Dashboard → Authentication → Policies

### Cause 3: User ID Mismatch
**Symptom:** Can't see your own files
**Fix:**
- Check that `user_id` in database matches `auth.uid()`
- Verify user is authenticated: `SELECT auth.uid()`

### Cause 4: Database Tables Don't Exist
**Symptom:** 401 or "relation does not exist" error
**Fix:**
- Run `database/setup.sql` in Supabase SQL Editor
- Verify tables were created

## Step-by-Step Debugging

### Step 1: Check Authentication
```javascript
// In browser console
import { supabase } from './services/supabase'
const { data: { session } } = await supabase.auth.getSession()
console.log('Logged in:', !!session)
console.log('User ID:', session?.user?.id)
```

### Step 2: Check Database Connection
```javascript
// Test if you can query the table
const { data, error } = await supabase
  .from('medical_records')
  .select('count')
  .limit(1)

console.log('Can access table:', !error)
console.log('Error:', error)
```

### Step 3: Check RLS Policies
Go to Supabase Dashboard → Authentication → Policies
- Should see policies for `medical_records`
- Should see "Users can view their own medical records"

### Step 4: Test with SQL
Run in Supabase SQL Editor:

```sql
-- Check your user ID
SELECT auth.uid() as current_user_id;

-- Check if you can see your records
SELECT COUNT(*) FROM medical_records 
WHERE user_id = auth.uid();
```

## Quick Fix Script

If you're getting 401 errors, run this in Supabase SQL Editor:

```sql
-- Re-enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Recreate policies (if they don't exist)
-- Users can view their own medical records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'medical_records' 
    AND policyname = 'Users can view their own medical records'
  ) THEN
    CREATE POLICY "Users can view their own medical records"
      ON medical_records FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
```

## Still Not Working?

1. **Check Supabase Dashboard → Logs** for server-side errors
2. **Check browser Network tab** - see which request is failing
3. **Verify environment variables** are correct
4. **Try logging out and back in**
5. **Clear browser cache and cookies**

## Need More Help?

Share:
- The exact error message from browser console
- Whether you can see the error in Network tab
- What happens when you try to log in
- Whether database tables exist

