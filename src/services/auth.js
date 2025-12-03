import { supabase } from './supabase'

// Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  
  if (error) {
    console.error('Google sign in error:', error)
    throw new Error(error.message || 'Failed to sign in with Google')
  }
  return data
}

// Sign in with Email
export const signInWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })
  
  if (error) {
    console.error('Email sign in error:', error)
    // Provide user-friendly error messages
    let errorMessage = 'Failed to sign in'
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password'
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please check your email and confirm your account'
    } else {
      errorMessage = error.message || 'Failed to sign in'
    }
    throw new Error(errorMessage)
  }
  return data
}

// Sign up with Email
export const signUpWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  })
  
  if (error) {
    console.error('Email sign up error:', error)
    let errorMessage = 'Failed to create account'
    if (error.message.includes('already registered')) {
      errorMessage = 'An account with this email already exists'
    } else if (error.message.includes('Password')) {
      errorMessage = error.message
    } else {
      errorMessage = error.message || 'Failed to create account'
    }
    throw new Error(errorMessage)
  }
  return data
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}
