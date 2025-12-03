import { useState, useEffect, useCallback } from 'react'
import { Copy, X, RefreshCw, Trash2, ExternalLink, QrCode } from 'lucide-react'
import { createShareLink, getUserShareLinks, revokeShareLink } from '../../services/shareService'
import { supabase } from '../../services/supabase'
import QRGenerator from '../QRCode/QRGenerator'
import { toast } from 'sonner'

export default function ShareDialog({ isOpen, onClose, userId: propUserId }) {
  const [shareLinks, setShareLinks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLinkForQR, setSelectedLinkForQR] = useState(null)
  const [actualUserId, setActualUserId] = useState(propUserId)
  const [newLink, setNewLink] = useState({
    days: 7,
    maxUses: 10
  })

  // Get userId from session if not provided
  useEffect(() => {
    const getUserId = async () => {
      if (propUserId) {
        setActualUserId(propUserId)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setActualUserId(session.user.id)
        } else {
          console.warn('No user session found')
          setActualUserId(null)
        }
      } catch (error) {
        console.error('Error getting user session:', error)
        setActualUserId(null)
      }
    }

    if (isOpen) {
      getUserId()
    }
  }, [isOpen, propUserId])

  const loadShareLinks = useCallback(async () => {
    const userIdToUse = actualUserId || propUserId
    
    if (!userIdToUse) {
      console.warn('No userId available for ShareDialog')
      setShareLinks([])
      return
    }

    try {
      setIsLoading(true)
      const links = await getUserShareLinks(userIdToUse)
      setShareLinks(links || [])
    } catch (error) {
      console.error('Error loading share links:', error)
      const errorMessage = error.message || 'Failed to load share links'
      toast.error(errorMessage)
      setShareLinks([])
    } finally {
      setIsLoading(false)
    }
  }, [actualUserId, propUserId])

  useEffect(() => {
    if (isOpen && actualUserId) {
      loadShareLinks()
    } else if (isOpen && !actualUserId && !propUserId) {
      // Only show error if we've checked and confirmed no user
      setTimeout(() => {
        toast.error('Please log in to share files')
      }, 100)
    }
  }, [isOpen, actualUserId, propUserId, loadShareLinks])

  const handleCreateLink = async () => {
    const userIdToUse = actualUserId || propUserId
    
    if (!userIdToUse) {
      toast.error('Please log in to create share links')
      return
    }

    try {
      setIsLoading(true)
      const link = await createShareLink(userIdToUse, {
        days: parseInt(newLink.days) || 7,
        maxUses: newLink.maxUses ? parseInt(newLink.maxUses) : null
      })
      
      setShareLinks([link, ...shareLinks])
      toast.success('Share link created successfully!')
    } catch (error) {
      console.error('Error creating share link:', error)
      const errorMessage = error.message || 'Failed to create share link'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeLink = async (linkId) => {
    if (!confirm('Are you sure you want to revoke this share link?')) return
    
    try {
      await revokeShareLink(linkId)
      setShareLinks(shareLinks.filter(link => link.id !== linkId))
      toast.success('Share link revoked')
    } catch (error) {
      console.error('Error revoking share link:', error)
      toast.error('Failed to revoke share link')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied to clipboard')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Share Medical Records</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Create New Share Link</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newLink.days}
                  onChange={(e) => setNewLink({...newLink, days: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Uses (leave empty for unlimited)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newLink.maxUses || ''}
                  onChange={(e) => setNewLink({...newLink, maxUses: e.target.value || null})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateLink}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Generate Link'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Active Share Links</h3>
            {isLoading && shareLinks.length === 0 ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : shareLinks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No active share links</p>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div 
                    key={link.id}
                    className={`border rounded-lg p-3 ${link.isExpired || link.isMaxUses ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <a 
                            href={link.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                          >
                            {link.shareUrl}
                          </a>
                          <button 
                            onClick={() => copyToClipboard(link.shareUrl)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Copy link"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expires: {new Date(link.expires_at).toLocaleString()}
                          {link.max_uses && ` • Max uses: ${link.use_count}/${link.max_uses}`}
                          {link.isExpired && <span className="text-red-500 ml-2">• Expired</span>}
                          {link.isMaxUses && !link.isExpired && <span className="text-red-500 ml-2">• Max uses reached</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedLinkForQR(link.shareUrl)}
                          className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-1"
                          title="Show QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeLink(link.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                          title="Revoke link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {selectedLinkForQR && (
            <div className="mt-6 border-t dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">QR Code for Share Link</h3>
                <button
                  onClick={() => setSelectedLinkForQR(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <QRGenerator shareUrl={selectedLinkForQR} fileName="share-link" />
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
