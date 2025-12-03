import { FileText } from 'lucide-react'
import FileCard from './FileCard'

const FileList = ({ files, loading, onFileDelete }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading files...</p>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No files yet
        </h3>
        <p className="text-gray-600">
          Upload your first medical document to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} onDelete={onFileDelete} />
      ))}
    </div>
  )
}

export default FileList