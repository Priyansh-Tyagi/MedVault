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

// Download file
export const downloadFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Get file URL
export const getFileUrl = (filePath) => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Backwards-compatible aliases for other modules
export const uploadFile = uploadMedicalRecord
export const deleteFile = deleteMedicalRecord