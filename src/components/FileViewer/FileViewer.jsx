import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Loader2 } from 'lucide-react'
import { getSignedUrl, downloadFileByRecord } from '../../services/storage'
import { toast } from 'sonner'

const FileViewer = ({ record, isOpen, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !record) return

    const loadFile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to get signed URL if public URL doesn't work
        if (record.storage_path) {
          const signedUrl = await getSignedUrl(record.storage_path, 3600)
          setFileUrl(signedUrl)
        } else if (record.public_url) {
          // Test if public URL works
          try {
            const response = await fetch(record.public_url, { method: 'HEAD' })
            if (response.ok) {
              setFileUrl(record.public_url)
            } else {
              // Fallback to signed URL
              if (record.storage_path) {
                const signedUrl = await getSignedUrl(record.storage_path, 3600)
                setFileUrl(signedUrl)
              } else {
                throw new Error('Unable to access file')
              }
            }
          } catch {
            // Public URL failed, try signed
            if (record.storage_path) {
              const signedUrl = await getSignedUrl(record.storage_path, 3600)
              setFileUrl(signedUrl)
            } else {
              throw new Error('Unable to access file')
            }
          }
        } else {
          throw new Error('No file URL available')
        }
      } catch (err) {
        console.error('Error loading file:', err)
        setError(err.message || 'Failed to load file')
        toast.error('Failed to load file for preview')
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [isOpen, record])

  const handleDownload = async () => {
    try {
      await downloadFileByRecord(record)
      toast.success('File download started')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download file')
    }
  }

  const isImage = record?.file_type?.startsWith('image/')
  const isPDF = record?.file_type === 'application/pdf'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {record?.file_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {record?.file_type}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading file...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download Instead
                </button>
              </div>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center justify-center h-full">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={record.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : isPDF ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px] rounded-lg shadow-lg border-0"
                  title={record.file_name}
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default FileViewer

