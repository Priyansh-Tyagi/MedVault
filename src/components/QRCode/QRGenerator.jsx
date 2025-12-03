import { useState } from 'react'
import { Copy, Download, X } from 'lucide-react'
import { toast } from 'sonner'

// Import QRCodeSVG - react-qr-code exports it as a named export
// Using * import to catch all exports and find the right one
import * as QRCodeLib from 'react-qr-code'

// Get the component - try different possible export names
const QRCodeSVG = QRCodeLib.QRCodeSVG || QRCodeLib.QRCode || QRCodeLib.default

// Fallback component if import fails
const FallbackQRCode = ({ value, size = 200, id, ...props }) => (
  <svg 
    id={id}
    width={size} 
    height={size} 
    viewBox={`0 0 ${size} ${size}`}
    style={{ background: '#fff', border: '1px solid #ddd' }}
    {...props}
  >
    <rect width={size} height={size} fill="#fff" />
    <text x="50%" y="50%" textAnchor="middle" fontSize="14" fill="#666" dy=".3em">
      QR Code
    </text>
    <text x="50%" y="60%" textAnchor="middle" fontSize="10" fill="#999" dy=".3em">
      (Install Error)
    </text>
  </svg>
)

// Use the imported component or fallback
const QRCodeComponent = QRCodeSVG || FallbackQRCode

const QRGenerator = ({ shareUrl, fileName = 'QR Code' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Share link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `${fileName}-qr-code.png`
      downloadLink.href = pngFile
      downloadLink.click()
      toast.success('QR code downloaded')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code</h3>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
          {shareUrl ? (
            <QRCodeComponent
              id="qr-code-svg"
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400 text-sm">No URL provided</p>
            </div>
          )}
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 truncate"
            />
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
              title="Copy link"
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`} />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Scan this QR code with any QR reader to access the shared medical records
        </p>
      </div>
    </div>
  )
}

export default QRGenerator

