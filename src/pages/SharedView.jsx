import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { validateShareToken, getSharedRecords } from '../services/shareService'
import { formatFileSize, getFileIcon } from '../utils/fileValidation'
import { downloadFileByRecord, getSignedUrl } from '../services/storage'
import { Download, ExternalLink, ArrowLeft, Shield, Clock, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import FileViewer from '../components/FileViewer/FileViewer'
import { toast } from 'sonner'

export default function SharedView() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareInfo, setShareInfo] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)

  useEffect(() => {
    const loadSharedRecords = async () => {
      try {
        setIsLoading(true)
        
        // Validate token first
        const shareLink = await validateShareToken(token)
        setShareInfo(shareLink)
        
        // Collect accessor info for logging
        const accessorInfo = {
          ipAddress: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'Unknown'),
          userAgent: navigator.userAgent,
          name: 'Doctor/Viewer'
        }
        
        const data = await getSharedRecords(token, accessorInfo)
        setRecords(data)
      } catch (err) {
        console.error('Error loading shared records:', err)
        setError(err.message || 'Invalid or expired share link. Please request a new link from the patient.')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedRecords()
    }
  }, [token])

  const handleView = (record) => {
    setViewingRecord(record)
  }

  const handleDownload = async (record) => {
    try {
      if (!record.storage_path) {
        toast.error('File path not found')
        return
      }

      await downloadFileByRecord(record)
      toast.success('Download started')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download file. Please try again.')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Shared Medical Records
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View-only access to patient medical records
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            {shareInfo && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires: {new Date(shareInfo.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  {shareInfo.max_uses && (
                    <span>
                      Uses: {shareInfo.use_count} / {shareInfo.max_uses}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No records found</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This is a secure, read-only view. All access is logged and monitored for security purposes.
                  </p>
                </div>
                
                {records.map((record) => (
                  <div 
                    key={record.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="text-4xl flex-shrink-0">
                            {getFileIcon(record.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {record.file_name}
                            </h3>
                            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
                              <span>{formatFileSize(record.file_size)}</span>
                              <span>•</span>
                              <span>
                                {record.record_date 
                                  ? new Date(record.record_date).toLocaleDateString()
                                  : new Date(record.created_at).toLocaleDateString()
                                }
                              </span>
                              {record.record_type && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                    {record.record_type}
                                  </span>
                                </>
                              )}
                              {record.provider_name && (
                                <>
                                  <span>•</span>
                                  <span>{record.provider_name}</span>
                                </>
                              )}
                            </div>
                            {record.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleView(record)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                            title="View file"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (!record.storage_path) {
                                  toast.error('File path not found')
                                  return
                                }
                                const signedUrl = await getSignedUrl(record.storage_path, 3600)
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a secure, read-only view of shared medical records.</p>
          <p className="mt-1">All access is logged and monitored for security purposes.</p>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingRecord && (
        <FileViewer
          record={viewingRecord}
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  )
}

