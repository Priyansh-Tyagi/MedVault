import { supabase } from './supabase'

// Create medical record metadata (consolidated to use medical_records table)
export const saveFileMetadata = async (fileData) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .insert([{
        user_id: fileData.userId,
        file_name: fileData.fileName,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        storage_path: fileData.storagePath,
        public_url: fileData.publicUrl,
        record_type: fileData.recordType || 'document',
        record_date: fileData.recordDate || new Date().toISOString(),
        provider_name: fileData.providerName,
        notes: fileData.notes,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Save metadata error:', error)
    throw error
  }
}

// Get all user files
export const getUserFiles = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated. Please log in.')
    }

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('Permission denied. Make sure RLS policies are set up correctly.')
      }
      if (error.code === '42501') {
        throw new Error('Access denied. Please check your database permissions.')
      }
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Get files error:', error)
    throw error
  }
}

// Delete file metadata
export const deleteFileMetadata = async (fileId) => {
  try {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', fileId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete metadata error:', error)
    throw error
  }
}

// Search files
export const searchFiles = async (userId, searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .ilike('file_name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Search error:', error)
    throw error
  }
}