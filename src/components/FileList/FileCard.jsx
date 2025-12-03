import { Download, Trash2, ExternalLink, Share2, Eye, X } from 'lucide-react'
import { formatFileSize, getFileIcon } from '../../utils/fileValidation'
import { deleteMedicalRecord, downloadFileByRecord, getSignedUrl } from '../../services/storage'
import { useState } from 'react'
import ShareDialog from './ShareDialog'
import { toast } from 'sonner'

const FileCard = ({ file, onDelete, userId }) => {
  const [deleting, setDeleting] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState(false)
  const [fileUrl, setFileUrl] = useState(null)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return

    setDeleting(true)
    try {
      await deleteMedicalRecord(file.id)
      onDelete?.(file.id)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete file. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleView = async () => {
    try {
      if (!file.storage_path) {
        toast.error('File path not found')
        return
      }

      const signedUrl = await getSignedUrl(file.storage_path, 3600)
      setFileUrl(signedUrl)
      setViewingFile(true)
    } catch (err) {
      console.error('Error getting file URL:', err)
      toast.error('Failed to load file. Please try downloading instead.')
    }
  }

  const handleDownload = async () => {
    try {
      if (!file.storage_path) {
        toast.error('File path not found')
        return
      }

      await downloadFileByRecord(file)
      toast.success('Download started')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download file')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="text-4xl flex-shrink-0">
              {getFileIcon(file.file_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {file.file_name}
              </h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{formatDate(file.record_date || file.created_at)}</span>
                {file.record_type && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {file.record_type}
                    </span>
                  </>
                )}
                {file.provider_name && (
                  <span className="text-gray-600 dark:text-gray-300">
                    {file.provider_name}
                  </span>
                )}
              </div>
              {file.notes && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {file.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleView}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
              title="View file"
            >
              <Eye className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsShareDialogOpen(true)}
              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            <button
              onClick={async () => {
                try {
                  if (!file.storage_path) {
                    toast.error('File path not found')
                    return
                  }
                  const signedUrl = await getSignedUrl(file.storage_path, 3600)
                  window.open(signedUrl, '_blank')
                } catch (err) {
                  toast.error('Failed to open file')
                }
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50"
              title="Delete"
            >
              {deleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog 
        isOpen={isShareDialogOpen} 
        onClose={() => setIsShareDialogOpen(false)} 
        userId={userId}
      />

      {/* File Viewer Modal */}
      {viewingFile && fileUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {file.file_name}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setViewingFile(false)
                    setFileUrl(null)
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {file.file_type?.includes('pdf') ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px] border-0 rounded"
                  title={file.file_name}
                />
              ) : file.file_type?.includes('image') ? (
                <div className="flex items-center justify-center">
                  <img
                    src={fileUrl}
                    alt={file.file_name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FileCard