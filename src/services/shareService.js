import { supabase } from './supabase'

// Generate a secure random token
const generateToken = () => {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Create a new share link
export const createShareLink = async (userId, options = {}) => {
  try {
    // Get user ID from session if not provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        throw new Error('User not authenticated')
      }
      userId = session.user.id
    }

    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (options.days || 7)) // Default 7 days

    const { data, error } = await supabase
      .from('share_links')
      .insert([
        {
          user_id: userId,
          token,
          expires_at: expiresAt.toISOString(),
          max_uses: options.maxUses || null,
          use_count: 0
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error creating share link:', error)
      if (error.code === '42501') {
        throw new Error('Permission denied. Make sure you are logged in and RLS policies are set up correctly.')
      }
      throw error
    }

    return {
      id: data[0].id,
      token,
      shareUrl: `${window.location.origin}/share/${token}`,
      expiresAt: expiresAt.toISOString(),
      maxUses: options.maxUses
    }
  } catch (error) {
    console.error('Error creating share link:', error)
    throw error
  }
}

// Validate a share token
export const validateShareToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      throw new Error('Invalid or expired share link')
    }

    // Check max uses if set
    if (data.max_uses && data.use_count >= data.max_uses) {
      throw new Error('Share link has reached maximum uses')
    }

    // Increment use count
    await supabase
      .from('share_links')
      .update({ use_count: data.use_count + 1 })
      .eq('id', data.id)

    return data
  } catch (error) {
    console.error('Error validating share token:', error)
    throw error
  }
}

// Get shared records for a token
export const getSharedRecords = async (token, accessorInfo = {}) => {
  try {
    // First validate the token
    const shareLink = await validateShareToken(token)
    
    if (!shareLink || !shareLink.user_id) {
      throw new Error('Invalid share link')
    }

    // Get the user's records using RPC function that bypasses RLS for share links
    // If RPC doesn't exist, fall back to direct query (may fail due to RLS)
    let data
    let error

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_shared_medical_records', {
        share_token: token
      })

      if (rpcError) {
        console.warn('RPC function error (may not exist):', rpcError)
        // If function doesn't exist (42883), try fallback
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
          console.warn('RPC function get_shared_medical_records does not exist. Please run database/fix_shared_records_access.sql')
          // Fallback: Try direct query (will likely fail due to RLS, but worth trying)
          const result = await supabase
            .from('medical_records')
            .select('*')
            .eq('user_id', shareLink.user_id)
            .order('record_date', { ascending: false })
          
          data = result.data
          error = result.error
          
          if (error && (error.code === '42501' || error.message?.includes('permission'))) {
            throw new Error('Database function not set up. Please run the SQL script: database/fix_shared_records_access.sql in Supabase SQL Editor.')
          }
        } else {
          throw rpcError
        }
      } else {
        data = rpcData || []
        error = null
      }
    } catch (rpcErr) {
      // If RPC completely fails, try direct query as last resort
      console.warn('RPC call failed, trying direct query:', rpcErr)
      const result = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', shareLink.user_id)
        .order('record_date', { ascending: false })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching shared records:', error)
      // If it's an RLS error, provide helpful message
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('row-level security')) {
        throw new Error('Unable to access records. Please run database/fix_shared_records_access.sql in Supabase SQL Editor to set up the database function.')
      }
      throw error
    }

    // Log access for each record (fire and forget)
    if (data && data.length > 0) {
      import('./accessLog').then(({ logAccess }) => {
        data.forEach(record => {
          logAccess(token, record.id, accessorInfo).catch(err => 
            console.error('Failed to log access:', err)
          )
        })
      })
    }

    return data || []
  } catch (error) {
    console.error('Error fetching shared records:', error)
    throw error
  }
}

// Revoke a share link
export const revokeShareLink = async (shareId) => {
  try {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', shareId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error revoking share link:', error)
    throw error
  }
}

// Get all share links for a user
export const getUserShareLinks = async (userId) => {
  try {
    // Get user ID from session if not provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        console.warn('No user ID provided and no session found')
        return []
      }
      userId = session.user.id
    }

    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching share links:', error)
      if (error.code === '22P02') {
        throw new Error('Invalid user ID. Please log out and log back in.')
      }
      throw error
    }

    return (data || []).map(link => ({
      ...link,
      shareUrl: `${window.location.origin}/share/${link.token}`,
      isExpired: new Date(link.expires_at) < new Date(),
      isMaxUses: link.max_uses ? link.use_count >= link.max_uses : false
    }))
  } catch (error) {
    console.error('Error fetching share links:', error)
    throw error
  }
}

// Backwards-compatible alias
export const getShareLinks = getUserShareLinks
