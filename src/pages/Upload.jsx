import FileUploader from '../components/FileUpload/FileUploader'

export default function Upload() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-8">
			<div className="w-full max-w-3xl">
				<FileUploader />
			</div>
		</div>
	)
}
