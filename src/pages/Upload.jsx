import { useAuth } from '../hooks/useAuth'
import FileUploader from '../components/FileUpload/FileUploader'
import Header from '../components/Common/Header'

export default function Upload() {
	const { user } = useAuth()
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<Header user={user} />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Medical Records</h1>
				<FileUploader userId={user?.id} onUploadComplete={() => {}} />
			</div>
		</div>
	)
}
