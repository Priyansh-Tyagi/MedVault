# Troubleshooting Guide

## Login Not Working

### 1. Check Environment Variables

Make sure you have a `.env` file in the `medvault/` directory with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- Go to Supabase Dashboard → Your Project → Settings → API
- Copy the "Project URL" → `VITE_SUPABASE_URL`
- Copy the "anon public" key → `VITE_SUPABASE_ANON_KEY`

**Important:** 
- Restart your dev server after adding/changing `.env` variables
- The `.env` file should be in the `medvault/` folder (not the root)

### 2. Check Browser Console

Open browser DevTools (F12) and check the Console tab for errors:

- **"Supabase not configured"** → Environment variables missing
- **"Invalid login credentials"** → Wrong email/password
- **"Email not confirmed"** → Need to verify email first
- **Network errors** → Check Supabase URL is correct

### 3. Common Login Issues

#### Issue: "Invalid login credentials"
**Solution:**
- Double-check email and password
- Make sure you've signed up first (use "Sign up" button)
- Check if email confirmation is required in Supabase settings

#### Issue: "Email not confirmed"
**Solution:**
- Check your email inbox (and spam folder)
- Click the verification link in the email
- Or disable email confirmation in Supabase:
  - Dashboard → Authentication → Settings
  - Disable "Enable email confirmations"

#### Issue: Nothing happens when clicking "Sign In"
**Solution:**
- Check browser console for errors
- Verify Supabase URL and key are correct
- Make sure dev server is running (`npm run dev`)
- Try refreshing the page

#### Issue: Google Sign In not working
**Solution:**
- Make sure Google OAuth is enabled in Supabase:
  - Dashboard → Authentication → Providers → Google
  - Enable Google provider
  - Add OAuth credentials (Client ID and Secret)
- Check redirect URL is set correctly in Google Console

### 4. Test Supabase Connection

Open browser console and run:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

### 5. Verify Database Setup

Make sure you've run the database setup:
- Go to Supabase SQL Editor
- Run `database/setup.sql`
- Verify tables exist: `medical_records`, `share_links`, `access_logs`

### 6. Check Supabase Auth Settings

In Supabase Dashboard → Authentication → Settings:

- **Site URL**: Should be `http://localhost:5173` (or your dev URL)
- **Redirect URLs**: Add `http://localhost:5173/**` and your production URL
- **Email confirmations**: Can be disabled for testing

### 7. Still Not Working?

1. **Clear browser cache and cookies**
2. **Try incognito/private window**
3. **Check Supabase project status** (Dashboard → Project Settings)
4. **Verify you're using the correct Supabase project**
5. **Check network tab** in DevTools for failed requests

## Other Common Issues

### Files Not Uploading
- Check storage bucket exists: `medical-records`
- Verify storage policies are set
- Check file size (max 10MB)
- Check file type (PDF, JPG, PNG, ZIP only)

### Share Links Not Working
- Verify `share_links` table exists
- Check token is valid (not expired)
- Verify RLS policies allow public token validation

### Access Logs Not Showing
- Check `access_logs` table exists
- Verify RLS policies allow inserts
- Check browser console for errors

## Getting Help

1. Check browser console for specific error messages
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify all setup steps in `QUICK_START.md`
4. Review `database/README.md` for database setup

