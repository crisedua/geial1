import { useState, useRef, useEffect } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function Upload() {
  const { uploadReport, getEcosystems } = useDatabase()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [ecosystem, setEcosystem] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ecosystems, setEcosystems] = useState<Array<{id: string, name: string, region: string}>>([])

  // Load ecosystems on component mount
  useEffect(() => {
    const loadEcosystems = async () => {
      try {
        const data = await getEcosystems()
        setEcosystems(data)
      } catch (error) {
        console.error('Error loading ecosystems:', error)
      }
    }
    loadEcosystems()
  }, [getEcosystems])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      setError('')
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''))
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      setFile(droppedFile)
      setError('')
      if (!title) {
        setTitle(droppedFile.name.replace('.pdf', ''))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setFile(null)
    setTitle('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !ecosystem || !region) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await uploadReport(file, title, ecosystem, region)
      setSuccess('Report uploaded successfully! Processing will begin shortly.')
      setFile(null)
      setTitle('')
      setEcosystem('')
      setRegion('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Navigate to reports page after a short delay
      setTimeout(() => {
        navigate('/reports')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a PDF report to start the AI-powered analysis process.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select PDF File</h2>
          
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Report Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field mt-1"
                placeholder="Enter report title"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ecosystem" className="block text-sm font-medium text-gray-700">
                  Ecosystem
                </label>
                <select
                  id="ecosystem"
                  value={ecosystem}
                  onChange={(e) => setEcosystem(e.target.value)}
                  className="input-field mt-1"
                  required
                >
                  <option value="">Select ecosystem</option>
                  {ecosystems.map((eco) => (
                    <option key={eco.id} value={eco.name}>
                      {eco.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <input
                  type="text"
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-field mt-1"
                  placeholder="Enter region"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !file}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Upload Report'
            )}
          </button>
        </div>
      </form>

      {/* Processing Info */}
      <div className="mt-8 card">
        <h3 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>Text Extraction:</strong> Extract text content from your PDF</p>
          <p>2. <strong>Smart Chunking:</strong> Break content into meaningful sections</p>
          <p>3. <strong>AI Analysis:</strong> Generate embeddings and categorize content</p>
          <p>4. <strong>Ready for Search:</strong> Your report becomes searchable and analyzable</p>
        </div>
      </div>
    </div>
  )
}
