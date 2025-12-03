import { Download, Trash2, ExternalLink, Share2 } from 'lucide-react'
import { formatFileSize, getFileIcon } from '../../utils/fileValidation'
import { deleteMedicalRecord } from '../../services/storage'
import { useState } from 'react'
import ShareDialog from './ShareDialog'

const FileCard = ({ file, onDelete, userId }) => {
  const [deleting, setDeleting] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

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

  const handleDownload = () => {
    window.open(file.public_url, '_blank')
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
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsShareDialogOpen(true)}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            <a
              href={file.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            
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
    </>
  )
}

export default FileCard