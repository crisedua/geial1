import { useState, useEffect, useRef } from 'react'
import { FileText, Send, Calendar, ChevronDown, Download, Info } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Ecosystem } from '../types'

export default function Home() {
  const { getEcosystems } = useDatabase()
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([])
  const [ecosystemsLoading, setEcosystemsLoading] = useState(true)
  const [formData, setFormData] = useState({
    ecosystem: '',
    focus: '',
    date: '',
    milestone: '',
    email: '',
    testimonial: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatedComunicado, setGeneratedComunicado] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadEcosystems = async () => {
      try {
        const data = await getEcosystems()
        setEcosystems(data)
      } catch (err) {
        console.error('Error loading ecosystems:', err)
        setError('Error cargando ecosistemas')
      } finally {
        setEcosystemsLoading(false)
      }
    }

    loadEcosystems()
  }, [getEcosystems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== HOME FORM DEBUG START ===')
    console.log('Form data being submitted:', formData)
    
    if (!formData.ecosystem || !formData.email) {
      console.log('Validation failed - missing required fields:', {
        ecosystem: formData.ecosystem,
        email: formData.email
      })
      setError('Por favor complete los campos requeridos')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setGeneratedComunicado('')
    console.log('Loading state set to true, cleared previous states')

    try {
      console.log('Making API request to /api/generate-public-comunicado')
      console.log('Request body:', JSON.stringify(formData, null, 2))
      
      const response = await fetch('/api/generate-public-comunicado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      const data = await response.json()
      console.log('Response data:', data)
      console.log('Data keys:', Object.keys(data))
      console.log('Data.comunicado:', data.comunicado)
      console.log('Data.comunicado type:', typeof data.comunicado)

      if (!response.ok) {
        console.error('Response not ok:', data)
        throw new Error(data.message || 'Error al generar el comunicado')
      }

      // Display the generated comunicado on screen
      console.log('Setting comunicado state with:', data.comunicado)
      setGeneratedComunicado(data.comunicado)
      console.log('Current generatedComunicado state after setting:', generatedComunicado)
      
      setSuccess('Comunicado generado exitosamente y guardado en la base de datos.')
      console.log('Success message set')
    } catch (err: any) {
      console.error('Error generating comunicado:', err)
      setError(err.message || 'Error al generar el comunicado')
    } finally {
      setLoading(false)
      console.log('Loading state set to false')
      console.log('=== HOME FORM DEBUG END ===')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      date: value
    }))
  }

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker()
    }
  }

  const downloadComunicado = () => {
    if (!generatedComunicado) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `comunicado-${formData.ecosystem}-${timestamp}.txt`
    
    const blob = new Blob([generatedComunicado], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Generador de Comunicados de Prensa – Comunicados de Prensa GEIAL</h1>
                <p className="text-primary-100 mt-1">
                  IAcelera.cl, especialistas en la implementación de soluciones de automatización con inteligencia artificial, ha desarrollado la aplicación web "Comunicados de prensa GEIAL".
                </p>
              </div>
            </div>
            <a
              href="/admin"
              className="text-white hover:text-primary-100 text-sm font-medium transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-gray-700 text-sm leading-relaxed space-y-2">
            <p>
              Su propósito es permitir la creación ágil, intuitiva y personalizada de comunicados de prensa, adaptados a cada uno de los ecosistemas participantes en GEIAL 2025, reduciendo de esta manera en un 80% el tiempo de desarrollo de un comunicado de prensa.
            </p>
            <p>
              La plataforma utiliza parámetros básicos definidos por el usuario del ecosistema solicitante y consulta automáticamente los datos correspondientes al año 2025 de GEIAL, generando comunicados con un formato estandarizado y profesional.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud de Informe</h2>
          <p className="text-gray-600 mb-6">
            Complete los siguientes datos para recibir su informe y comunicado de prensa
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ecosystem Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Ecosistema participante de GEIAL *
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Selecciona el ecosistema al que debe hacer referencia el comunicado de prensa.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <div className="relative">
                <select
                  value={formData.ecosystem}
                  onChange={(e) => handleInputChange('ecosystem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Selecciona un ecosistema</option>
                  {ecosystemsLoading ? (
                    <option disabled>Cargando ecosistemas...</option>
                  ) : (
                    ecosystems.map((eco) => (
                      <option key={eco.id} value={eco.name}>{eco.name}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El sistema combinar� datos del comparado + informe espec�fico del ecosistema (si est� disponible)
              </p>
            </div>

            {/* Focus Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Foco del comunicado
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Indica el eje central del comunicado (por ejemplo: una fuerza dinamizadora, una dimensión del reporte u otro aspecto relevante).
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                value={formData.focus}
                onChange={(e) => handleInputChange('focus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingrese el enfoque del informe"
              />
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Fecha de Comunicación
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Especifica la fecha que debe aparecer en el comunicado.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formData.date}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="mm/dd/yyyy"
                />
                <button
                  type="button"
                  onClick={handleCalendarClick}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Milestone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Hito a destacar
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Señala la actividad, evento o situación que deseas relevar (por ejemplo: lanzamiento del reporte, evento de difusión, logro destacado, etc.).
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                value={formData.milestone}
                onChange={(e) => handleInputChange('milestone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingrese el hito o evento importante"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Correo electrónico de contacto
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Ingresa el correo electrónico del profesional que solicita el comunicado.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="su.email@ejemplo.com"
                required
              />
            </div>

            {/* Testimonial Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  Testimonio del ecosistema (opcional)
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                      Puedes añadir una cuña o declaración de un actor relevante del ecosistema.<br/>
                      En caso de no contar con ella, la aplicación dejará un espacio reservado en el formato de salida para que pueda agregarse manualmente.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              <textarea
                value={formData.testimonial}
                onChange={(e) => handleInputChange('testimonial', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingrese un testimonio o declaración relevante para incluir en el comunicado"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional: Incluya un testimonio o declaración que desee destacar en el comunicado
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Generar Comunicado
            </button>
          </form>
        </div>

        {/* Generated Comunicado Display */}
        {generatedComunicado && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Comunicado Generado</h2>
                <button
                  onClick={downloadComunicado}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                  {generatedComunicado}
                </pre>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setGeneratedComunicado('')}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

