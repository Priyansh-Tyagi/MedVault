import { supabase } from './supabase'

const BUCKET_NAME = 'medical-records'
const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Image',
  'image/png': 'Image',
  'image/gif': 'Image',
  'application/msword': 'Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document',
  'application/vnd.ms-excel': 'Spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Spreadsheet'
}

// Upload medical record file
export const uploadMedicalRecord = async (file, userId, metadata = {}) => {
  try {
    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      throw new Error('File type not allowed')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    // Save record metadata to database
    const { data: recordData, error: recordError } = await supabase
      .from('medical_records')
      .insert([
        {
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          public_url: publicUrl,
          record_type: metadata.recordType || 'document',
          record_date: metadata.recordDate || new Date().toISOString(),
          provider_name: metadata.providerName,
          notes: metadata.notes
        }
      ])
      .select()

    if (recordError) throw recordError

    return {
      id: recordData[0].id,
      path: uploadData.path,
      publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      recordType: metadata.recordType,
      recordDate: metadata.recordDate,
      providerName: metadata.providerName
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Delete medical record
export const deleteMedicalRecord = async (recordId) => {
  try {
    // First get the record to get the storage path
    const { data: record, error: fetchError } = await supabase
      .from('medical_records')
      .select('storage_path')
      .eq('id', recordId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([record.storage_path])

    if (deleteError) throw deleteError

    // Delete from database
    const { error: dbError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)

    if (dbError) throw dbError

    return true
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// Download file using storage path
export const downloadFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) throw error
    
    // Create download link
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = filePath.split('/').pop()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return data
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Get signed URL for file (works for private buckets)
// Note: This requires authentication. For unauthenticated users (share links),
// we need to use a different approach or make the bucket accessible via policies
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // For unauthenticated users, try to get public URL first
      // This will work if storage policy allows it
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)
      
      // Test if public URL works
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' })
        if (response.ok) {
          return publicUrl
        }
      } catch (e) {
        // Public URL doesn't work, throw error
        throw new Error('File access requires authentication. Please ensure storage policies allow access via share links.')
      }
    }
    
    // For authenticated users, create signed URL
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error
    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }
}

// Get file URL (tries public first, then signed)
export const getFileUrl = async (filePath, useSigned = false) => {
  if (useSigned) {
    return await getSignedUrl(filePath)
  }
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Download file by record (uses storage_path)
export const downloadFileByRecord = async (record) => {
  try {
    if (!record.storage_path) {
      throw new Error('Storage path not found')
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // For unauthenticated users (share links), use public URL or signed URL
      // First try to get a URL that works
      const signedUrl = await getSignedUrl(record.storage_path)
      
      // Download via fetch and create blob
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error('Failed to download file')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = record.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }

    // For authenticated users, use direct download
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(record.storage_path)

    if (error) {
      // If download fails, try signed URL
      console.warn('Direct download failed, trying signed URL:', error)
      const signedUrl = await getSignedUrl(record.storage_path)
      window.open(signedUrl, '_blank')
      return
    }

    // Create download
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = record.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Backwards-compatible aliases for other modules
export const uploadFile = uploadMedicalRecord
export const deleteFile = deleteMedicalRecord