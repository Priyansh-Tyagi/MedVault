import { supabase } from './supabase'

// Log access to shared records
export const logAccess = async (shareToken, recordId, accessorInfo = {}) => {
  try {
    // Get share link info
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('id, user_id')
      .eq('token', shareToken)
      .single()

    if (!shareLink) {
      throw new Error('Invalid share token')
    }

    // Log the access
    const { data, error } = await supabase
      .from('access_logs')
      .insert([
        {
          share_link_id: shareLink.id,
          record_id: recordId,
          accessed_at: new Date().toISOString(),
          ip_address: accessorInfo.ipAddress,
          user_agent: accessorInfo.userAgent,
          accessor_name: accessorInfo.name || 'Unknown'
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error logging access:', error)
    // Don't throw - logging shouldn't break the main flow
    return null
  }
}

// Get access logs for a user's shared records
export const getAccessLogs = async (userId) => {
  try {
    // Get all share links for the user
    const { data: shareLinks } = await supabase
      .from('share_links')
      .select('id')
      .eq('user_id', userId)

    if (!shareLinks || shareLinks.length === 0) {
      return []
    }

    const shareLinkIds = shareLinks.map(link => link.id)

    // Get access logs for these share links
    const { data, error } = await supabase
      .from('access_logs')
      .select(`
        *,
        share_links!inner(token),
        medical_records!inner(file_name)
      `)
      .in('share_link_id', shareLinkIds)
      .order('accessed_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching access logs:', error)
    throw error
  }
}

// Get access logs for a specific share link
export const getShareLinkAccessLogs = async (shareLinkId) => {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select(`
        *,
        medical_records(file_name, file_type)
      `)
      .eq('share_link_id', shareLinkId)
      .order('accessed_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching share link access logs:', error)
    throw error
  }
}

