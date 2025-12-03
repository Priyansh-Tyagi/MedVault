# Fixing 401 Auth Error on Page Load

## The Problem

You're seeing this error:
```
GET https://ocecyndewvtphzopxqen.supabase.co/auth/v1/user 401 (Unauthorized)
```

This happens when:
- Supabase tries to validate a stale/expired token on page load
- The token is stored in localStorage but has expired
- A previous session wasn't properly cleared

## What I Fixed

1. **Better error handling** - Now gracefully handles stale tokens
2. **Automatic session cleanup** - Clears invalid sessions automatically
3. **Improved auth initialization** - Better handling of auth state changes

## Quick Fixes

### Option 1: Clear Browser Storage (Quickest)

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → Your site URL
4. Delete all keys containing "supabase" or "auth"
5. Refresh the page

Or run this in browser console:
```javascript
// Clear all Supabase auth data
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth')) {
    localStorage.removeItem(key)
  }
})
location.reload()
```

### Option 2: Log Out and Back In

1. If you can access the app, click "Log Out"
2. Clear browser cache
3. Log back in

### Option 3: Check Supabase Configuration

Make sure your `.env` file has correct credentials:

```env
VITE_SUPABASE_URL=https://ocecyndewvtphzopxqen.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

**Important:** 
- Restart dev server after changing `.env`
- Make sure there are no extra spaces or quotes

## Why This Happens

This error is usually harmless - it just means:
- You had a previous session that expired
- Supabase is trying to validate it and failing (which is normal)
- The app should handle this gracefully now

## Verification

After the fix, the error should:
1. Still appear in console (normal Supabase behavior)
2. But NOT break the app
3. The app should continue working normally

If you're logged in, you should still be able to use the app even if this error appears.

## Still Seeing Issues?

1. **Clear browser storage** (see Option 1 above)
2. **Restart your dev server**: `npm run dev`
3. **Check Supabase Dashboard** → Authentication → Users
   - Make sure your user exists
   - Check if email is confirmed (if required)
4. **Check browser console** for other errors
5. **Try incognito/private window** to test with clean state

## Technical Details

The fix adds:
- Better error handling in `useAuth` hook
- Automatic cleanup of stale sessions
- Graceful handling of 401 errors during initialization

This is a common issue with Supabase auth and is now handled gracefully.

