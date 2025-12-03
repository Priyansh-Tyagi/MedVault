import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if Supabase is properly configured
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key'

if (!isConfigured) {
  console.error('❌ Supabase not configured!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.error('Get these from: Supabase Dashboard → Settings → API')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'medvault-auth',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'medvault'
    }
  }
})

// Helper to clear stale session
export const clearStaleSession = async () => {
  try {
    // Clear from localStorage
    const storageKey = 'medvault-auth'
    if (window.localStorage) {
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('medvault-auth')) {
          try {
            window.localStorage.removeItem(key)
          } catch (e) {
            // Ignore errors
          }
        }
      })
    }
    
    // Try to sign out (will fail silently if no session)
    const { error } = await supabase.auth.signOut()
    if (error && !error.message.includes('Invalid Refresh Token')) {
      // Only log non-stale-token errors
      console.warn('Could not clear session:', error.message)
    }
  } catch (err) {
    // Silently fail - session might already be cleared or invalid
  }
}

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured