import { supabase } from './supabase'

// Create files table metadata
export const saveFileMetadata = async (fileData) => {
  try {
    const { data, error } = await supabase
      .from('files')
      .insert([{
        user_id: fileData.userId,
        file_name: fileData.fileName,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        storage_path: fileData.storagePath,
        public_url: fileData.publicUrl,
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
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get files error:', error)
    throw error
  }
}

// Delete file metadata
export const deleteFileMetadata = async (fileId) => {
  try {
    const { error } = await supabase
      .from('files')
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
      .from('files')
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