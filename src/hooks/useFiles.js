import { useState, useEffect, useCallback } from 'react'
import { getUserFiles } from '../services/firestore'

export const useFiles = (userId) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFiles = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getUserFiles(userId)
      setFiles(data)
    } catch (err) {
      setError(err.message ?? String(err))
      console.error('Fetch files error:', err)
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