import { useState, useEffect } from 'react'
import { supabase, clearStaleSession } from '../services/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          // Handle stale/invalid token gracefully
          if (sessionError.message?.includes('401') || sessionError.message?.includes('JWT')) {
            console.warn('Stale session detected, clearing...')
            await clearStaleSession()
            if (mounted) {
              setUser(null)
              setLoading(false)
            }
            return
          }
          
          console.error('Session error:', sessionError)
          if (mounted) {
            setError(sessionError.message)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          setError(null)
        }
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          setError(null)
        }
      } else {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}