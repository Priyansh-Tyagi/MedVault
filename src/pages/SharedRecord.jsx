import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSharedRecords } from '../services/shareService'
import { formatFileSize, getFileIcon } from '../utils/fileValidation'
import { Download, ExternalLink, ArrowLeft } from 'lucide-react'

export default function SharedRecord() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [patientName, setPatientName] = useState('')

  useEffect(() => {
    const loadSharedRecords = async () => {
      try {
        setIsLoading(true)
        const data = await getSharedRecords(token)
        setRecords(data)
        
        // If we have records, get the patient's name
        if (data.length > 0) {
          // In a real app, you would fetch the patient's name from the user profile
          setPatientName("Patient's")
        }
      } catch (err) {
        console.error('Error loading shared records:', err)
        setError('Invalid or expired share link. Please request a new link from the patient.')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedRecords()
    }
  }, [token])

  const handleDownload = (url, fileName) => {
    // This is a simple download approach that works for same-origin URLs
    // For external URLs, you might need a different approach
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                            <span>{new Date(record.record_date).toLocaleDateString()}</span>
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
                          onClick={() => handleDownload(record.public_url, record.file_name)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <a
                          href={record.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
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
    </div>
  )
}
