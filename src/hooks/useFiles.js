import { useState, useEffect, useCallback } from 'react'
import { getUserFiles } from '../services/firestore'

export const useFiles = (userId) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFiles = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setFiles([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getUserFiles(userId)
      setFiles(data || [])
    } catch (err) {
      const errorMessage = err.message ?? String(err)
      setError(errorMessage)
      console.error('Fetch files error:', err)
      
      // Show user-friendly error message
      if (errorMessage.includes('permission') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        console.error('⚠️ Authentication or permission error. Make sure:')
        console.error('1. You are logged in')
        console.error('2. RLS policies are set up correctly')
        console.error('3. Database tables exist')
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const refreshFiles = () => {
    fetchFiles()
  }

  return { files, loading, error, refreshFiles }
}