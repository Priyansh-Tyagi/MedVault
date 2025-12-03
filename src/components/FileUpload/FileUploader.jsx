import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { validateFile, formatFileSize, getFileIcon } from '../../utils/fileValidation'
import { uploadFile } from '../../services/storage'
import { saveFileMetadata } from '../../services/firestore'

const FileUploader = ({ userId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const onDrop = (acceptedFiles) => {
    const validatedFiles = acceptedFiles.map(file => {
      const validation = validateFile(file)
      return {
        file,
        id: Math.random().toString(36).substring(7),
        ...validation
      }
    })
    setSelectedFiles(prev => [...prev, ...validatedFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/zip': ['.zip']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleUpload = async () => {
    const validFiles = selectedFiles.filter(f => f.isValid)
    if (validFiles.length === 0) return

    setUploading(true)

    for (const fileObj of validFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [fileObj.id]: 'uploading' }))

        // Upload to storage
        const storageResult = await uploadFile(fileObj.file, userId)

        // Save metadata to database
        await saveFileMetadata({
          userId,
          fileName: fileObj.file.name,
          fileType: fileObj.file.type,
          fileSize: fileObj.file.size,
          storagePath: storageResult.path,
          publicUrl: storageResult.publicUrl
        })

        setUploadProgress(prev => ({ ...prev, [fileObj.id]: 'success' }))
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadProgress(prev => ({ ...prev, [fileObj.id]: 'error' }))
      }
    }

    setUploading(false)
    
    // Clear successful uploads after a delay
    setTimeout(() => {
      setSelectedFiles(prev => 
        prev.filter(f => uploadProgress[f.id] !== 'success')
      )
      setUploadProgress({})
      onUploadComplete?.()
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: PDF, JPG, PNG, ZIP (Max 10MB per file)
            </p>
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            {!uploading && (
              <button
                onClick={handleUpload}
                disabled={selectedFiles.filter(f => f.isValid).length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Upload All
              </button>
            )}
          </div>

          <div className="space-y-2">
            {selectedFiles.map((fileObj) => {
              const status = uploadProgress[fileObj.id]
              
              return (
                <div
                  key={fileObj.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border
                    ${fileObj.isValid ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}
                    ${status === 'success' ? 'bg-green-50 border-green-200' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {getFileIcon(fileObj.file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      {!fileObj.isValid && (
                        <div className="mt-1">
                          {fileObj.errors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-600 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{error}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {status === 'uploading' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                    {status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {!status && !uploading && (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader