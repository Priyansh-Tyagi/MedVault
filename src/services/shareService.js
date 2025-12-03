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
          max_uses: options.maxUses,
          use_count: 0
        }
      ])
      .select()

    if (error) throw error

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
export const getSharedRecords = async (token) => {
  try {
    // First validate the token
    const shareLink = await validateShareToken(token)
    
    // Get the user's records
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', shareLink.user_id)
      .order('record_date', { ascending: false })

    if (error) throw error

    return data
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
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(link => ({
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
