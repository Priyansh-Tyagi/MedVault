import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSharedRecords } from '../services/shareService'
import { formatFileSize, getFileIcon } from '../utils/fileValidation'
import { downloadFileByRecord, getSignedUrl } from '../services/storage'
import { Download, ExternalLink, ArrowLeft, Eye, X } from 'lucide-react'
import { toast } from 'sonner'

export default function SharedRecord() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [viewingRecord, setViewingRecord] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)

  useEffect(() => {
    const loadSharedRecords = async () => {
      try {
        setIsLoading(true)
        
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
        console.log('Fetched shared records:', data)
        
        if (!data || data.length === 0) {
          console.warn('No records returned. This might mean:')
          console.warn('1. The database function get_shared_medical_records is not created')
          console.warn('2. RLS policies are blocking access')
          console.warn('3. The user has no records')
          console.warn('Please run database/fix_shared_records_access.sql in Supabase SQL Editor')
        }
        
        setRecords(data || [])
        
        // If we have records, get the patient's name
        if (data && data.length > 0) {
          // In a real app, you would fetch the patient's name from the user profile
          setPatientName("Patient's")
        }
      } catch (err) {
        console.error('Error loading shared records:', err)
        const errorMessage = err.message || 'Invalid or expired share link. Please request a new link from the patient.'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedRecords()
    }
  }, [token])

  const handleView = async (record) => {
    try {
      if (!record.storage_path) {
        toast.error('File path not found')
        return
      }

      const signedUrl = await getSignedUrl(record.storage_path, 3600)
      setFileUrl(signedUrl)
      setViewingRecord(record)
    } catch (err) {
      console.error('Error getting file URL:', err)
      toast.error('Failed to load file. Please try downloading instead.')
    }
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {patientName} Medical Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View-only access to shared medical records
          </p>
        </div>

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
              records.map((record) => (
                <div 
                  key={record.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl flex-shrink-0">
                          {getFileIcon(record.file_type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {record.file_name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
                            <span>{formatFileSize(record.file_size)}</span>
                            <span>•</span>
                            <span>
                              {record.record_date 
                                ? new Date(record.record_date).toLocaleDateString()
                                : new Date(record.created_at).toLocaleDateString()
                              }
                            </span>
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
                      <div className="flex space-x-2">
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
              ))
            )}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a secure, read-only view of shared medical records.</p>
          <p className="mt-1">All access is logged and monitored for security purposes.</p>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingRecord && fileUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingRecord.file_name}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(viewingRecord)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setViewingRecord(null)
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
              {viewingRecord.file_type?.includes('pdf') ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px] border-0 rounded"
                  title={viewingRecord.file_name}
                />
              ) : viewingRecord.file_type?.includes('image') ? (
                <div className="flex items-center justify-center">
                  <img
                    src={fileUrl}
                    alt={viewingRecord.file_name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => handleDownload(viewingRecord)}
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
    </div>
  )
}
