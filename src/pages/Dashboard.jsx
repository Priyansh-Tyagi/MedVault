import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useFiles } from '../hooks/useFiles'
import { searchFiles } from '../services/firestore'
import { getShareLinks, revokeShareLink } from '../services/shareService'
import Header from '../components/Common/Header'
import SearchBar from '../components/Common/SearchBar'
import FileUploader from '../components/FileUpload/FileUploader'
import FileList from '../components/FileList/FileList'
import { Upload, FolderOpen, Share2, FileText, Clock, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const { files, loading, refreshFiles, error: filesError } = useFiles(user?.id)
  const [activeTab, setActiveTab] = useState('files')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [shareLinks, setShareLinks] = useState([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults(null)
      return
    }

    setSearching(true)
    try {
      const results = await searchFiles(user.id, searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleUploadComplete = () => {
    refreshFiles()
    setActiveTab('files')
  }

  const handleFileDelete = () => {
    refreshFiles()
  }

  useEffect(() => {
    const loadShareLinks = async () => {
      if (activeTab === 'shares' && user?.id) {
        setIsLoadingLinks(true)
        try {
          const links = await getShareLinks(user.id)
          setShareLinks(links)
        } catch (error) {
          console.error('Error loading share links:', error)
        } finally {
          setIsLoadingLinks(false)
        }
      }
    }
    
    loadShareLinks()
  }, [activeTab, user?.id])

  const displayFiles = searchResults !== null ? searchResults : files
  
  // (formatFileType removed — unused)

  const tabs = [
    { id: 'files', label: 'My Files', icon: FolderOpen },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'shares', label: 'Shared Links', icon: Share2 }
  ]

  const handleRevokeLink = async (linkId) => {
    if (!confirm('Are you sure you want to revoke this share link? This will immediately disable access for anyone with this link.')) {
      return
    }

    try {
      await revokeShareLink(linkId)
      setShareLinks(shareLinks.filter(link => link.id !== linkId))
      // Show success message
    } catch (error) {
      console.error('Error revoking share link:', error)
      // Show error message
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if files failed to load due to auth
  if (filesError && (filesError.includes('permission') || filesError.includes('401') || filesError.includes('Unauthorized') || filesError.includes('not authenticated'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
            <p className="text-red-700 mb-4">{filesError}</p>
            <div className="text-sm text-red-600 space-y-1">
              <p>• Make sure you are logged in</p>
              <p>• Check that database tables exist (run database/setup.sql)</p>
              <p>• Verify RLS policies are set up correctly</p>
              <p>• Check browser console for more details</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Manage your medical records securely in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{files.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Storage Used</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(files.reduce((acc, f) => acc + f.file_size, 0) / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quick Share</p>
                <p className="text-sm font-medium text-gray-900">QR Code Ready</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Share2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8 max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {/* Files Tab */}
            {activeTab === 'files' && (
              <>
                <div className="mb-6">
                  <SearchBar onSearch={handleSearch} loading={searching} />
                </div>
                <FileList 
                  files={displayFiles} 
                  loading={loading && !searching} 
                  onFileDelete={handleFileDelete}
                  userId={user?.id}
                />
              </>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <FileUploader userId={user?.id} onUploadComplete={handleUploadComplete} />
            )}

            {/* Share Tab */}
            {activeTab === 'shares' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Shared Links</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage your shared record links and track their usage
                  </p>
                </div>

                {isLoadingLinks ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : shareLinks.length === 0 ? (
                  <div className="p-8 text-center">
                    <Share2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-gray-500 dark:text-gray-400">No shared links yet</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Share your records by clicking the share icon on any file
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {shareLinks.map((link) => (
                      <div key={link.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <a 
                                  href={link.shareUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {link.shareUrl.split('/').pop()}
                                </a>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  link.isExpired || link.isMaxUses 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {link.isExpired ? 'Expired' : link.isMaxUses ? 'Max Used' : 'Active'}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-3">
                                <span>Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
                                <span>•</span>
                                <span>{link.use_count} {link.use_count === 1 ? 'view' : 'views'}</span>
                                {link.max_uses > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{link.max_uses - link.use_count} remaining</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigator.clipboard.writeText(link.shareUrl)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Copy link"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleRevokeLink(link.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Revoke link"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard