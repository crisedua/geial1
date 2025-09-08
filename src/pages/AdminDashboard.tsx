import { useState, useEffect, useRef } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Report, Contact, Comunicado } from '../types'
import { 
  FileText, 
  Upload, 
  MapPin, 
  Send, 
  MessageSquare, 
  BarChart3,
  Settings,
  Search,
  Users,
  AlertCircle,
  Loader,
  X,
  CheckCircle
} from 'lucide-react'

export default function AdminDashboard() {
  const { getReports, getContacts, getComunicados, getEcosystems, uploadReport } = useDatabase()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [reports, setReports] = useState<Report[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [ecosystems, setEcosystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadEcosystem, setUploadEcosystem] = useState('')
  const [uploadRegion, setUploadRegion] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [reportsData, contactsData, comunicadosData, ecosystemsData] = await Promise.all([
          getReports(),
          getContacts(),
          getComunicados(),
          getEcosystems()
        ])
        setReports(reportsData)
        setContacts(contactsData)
        setComunicados(comunicadosData)
        setEcosystems(ecosystemsData)
      } catch (err: any) {
        setError(err.message || 'Error loading data')
        console.error('Error loading admin dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getReports, getContacts, getComunicados, getEcosystems])

  // Upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setUploadError('Por favor selecciona un archivo PDF')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('El archivo debe ser menor a 10MB')
        return
      }
      setUploadFile(selectedFile)
      setUploadError('')
      if (!uploadTitle) {
        setUploadTitle(selectedFile.name.replace('.pdf', ''))
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setUploadError('Por favor selecciona un archivo PDF')
        return
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setUploadError('El archivo debe ser menor a 10MB')
        return
      }
      setUploadFile(droppedFile)
      setUploadError('')
      if (!uploadTitle) {
        setUploadTitle(droppedFile.name.replace('.pdf', ''))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setUploadFile(null)
    setUploadTitle('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !uploadTitle || !uploadEcosystem || !uploadRegion) {
      setUploadError('Por favor completa todos los campos')
      return
    }

    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      await uploadReport(uploadFile, uploadTitle, uploadEcosystem, uploadRegion)
      setUploadSuccess('¡Informe subido exitosamente! El procesamiento comenzará en breve.')
      setUploadFile(null)
      setUploadTitle('')
      setUploadEcosystem('')
      setUploadRegion('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Reload data to show new report
      setTimeout(() => {
        loadData()
      }, 1000)
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir el informe')
    } finally {
      setUploadLoading(false)
    }
  }

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'upload', name: 'Subir Informes', icon: Upload },
    { id: 'reports', name: 'Informes', icon: FileText },
    { id: 'locations', name: 'Ubicaciones', icon: MapPin },
    { id: 'distribute', name: 'Distribuir', icon: Send },
    { id: 'comunicados', name: 'Comunicados', icon: MessageSquare },
    { id: 'analytics', name: 'Analíticas', icon: BarChart3 },
    { id: 'contacts', name: 'Contactos', icon: Users },
    { id: 'search', name: 'Buscar', icon: Search },
    { id: 'settings', name: 'Configuración', icon: Settings }
  ]

  // Calculate real stats from database
  const stats = [
    { 
      name: 'Total Informes', 
      value: reports.length.toString(), 
      icon: FileText, 
      color: 'text-blue-600' 
    },
    { 
      name: 'Ubicaciones', 
      value: ecosystems.length.toString(), 
      icon: MapPin, 
      color: 'text-green-600' 
    },
    { 
      name: 'Comunicados', 
      value: comunicados.length.toString(), 
      icon: MessageSquare, 
      color: 'text-purple-600' 
    },
    { 
      name: 'Contactos', 
      value: contacts.length.toString(), 
      icon: Users, 
      color: 'text-orange-600' 
    }
  ]

  // Get recent reports (last 5)
  const recentReports = reports
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Get recent comunicados (last 3)
  const recentComunicados = comunicados
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error cargando datos</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Report Insight Express</h1>
            </div>


            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.slice(1, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h2>
              <div className="space-y-3">
                {recentReports.length === 0 && recentComunicados.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay actividad reciente</p>
                ) : (
                  <>
                    {recentReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{report.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(report.created_at)} • {report.ecosystem}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status === 'completed' ? 'Completado' : 
                           report.status === 'processing' ? 'Procesando' : 
                           report.status === 'failed' ? 'Falló' : report.status}
                        </span>
                      </div>
                    ))}
                    {recentComunicados.map((comunicado) => (
                      <div key={comunicado.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium text-gray-900">{comunicado.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(comunicado.created_at)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(comunicado.status)}`}>
                          {comunicado.status === 'sent' ? 'Enviado' : 'Borrador'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informes</h2>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay informes disponibles</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{report.title}</p>
                        <p className="text-sm text-gray-500">
                          {report.ecosystem} • {report.region} • {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status === 'completed' ? 'Completado' : 
                       report.status === 'processing' ? 'Procesando' : 
                       report.status === 'failed' ? 'Falló' : report.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'comunicados' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comunicados</h2>
            <div className="space-y-3">
              {comunicados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay comunicados disponibles</p>
              ) : (
                comunicados.map((comunicado) => (
                  <div key={comunicado.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">{comunicado.title}</p>
                        <p className="text-sm text-gray-500">
                          {comunicado.report_ids.length} reporte{comunicado.report_ids.length !== 1 ? 's' : ''} • 
                          {new Date(comunicado.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(comunicado.status)}`}>
                      {comunicado.status === 'sent' ? 'Enviado' : 'Borrador'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contactos</h2>
            <div className="space-y-3">
              {contacts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay contactos disponibles</p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-500">
                          {contact.email} • {contact.organization} • {contact.ecosystem}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Subir Informes</h2>
            
            {uploadSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800">{uploadSuccess}</p>
              </div>
            )}

            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{uploadError}</p>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {uploadFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{uploadFile.name}</span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Archivos PDF, hasta 10MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Seleccionar Archivo
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Informe
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa el título del informe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ecosistema
                  </label>
                  <select
                    value={uploadEcosystem}
                    onChange={(e) => setUploadEcosystem(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecciona un ecosistema</option>
                    {ecosystems.map((eco) => (
                      <option key={eco.id} value={eco.name}>
                        {eco.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Región
                  </label>
                  <input
                    type="text"
                    value={uploadRegion}
                    onChange={(e) => setUploadRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa la región"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {uploadLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Subir Informe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}