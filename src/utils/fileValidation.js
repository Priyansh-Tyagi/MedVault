// Allowed file types
const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Image',
  'image/jpg': 'Image',
  'image/png': 'Image',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP'
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const validateFile = (file) => {
  const errors = []

  // Check file type
  if (!ALLOWED_TYPES[file.type]) {
    errors.push(`File type "${file.type}" is not allowed. Only PDF, Images (JPG, PNG), and ZIP files are accepted.`)
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid file name')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('zip')) return '📦'
  return '📁'
}