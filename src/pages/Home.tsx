import { useState } from 'react'
import { FileText, Send, Calendar, ChevronDown } from 'lucide-react'

const ecosystems = [
  'Argentina - Córdoba capital',
  'Argentina - Rafaela',
  'Argentina - Rio Cuarto',
  'Argentina - Villa María',
  'Brasil - San Pablo',
  'Chile - Antofagasta',
  'Chile - Concepción',
  'Chile - La Serena - Coquimbo',
  'Chile - Santiago',
  'Chile - Valparaiso',
  'Colombia - Barranquilla',
  'Colombia - Bogotá',
  'Colombia - Medellín',
  'México - Ciudad de México',
  'México - Guadalajara',
  'Perú - Lima',
  'Uruguay - Montevideo'
]

export default function Home() {
  const [formData, setFormData] = useState({
    ecosystem: '',
    focus: '',
    date: '',
    milestone: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ecosystem || !formData.email) {
      setError('Por favor complete los campos requeridos')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/generate-public-comunicado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al generar el comunicado')
      }

      setSuccess('Comunicado generado exitosamente. Se enviará a su email.')
      
      // Reset form
      setFormData({
        ecosystem: '',
        focus: '',
        date: '',
        milestone: '',
        email: ''
      })
    } catch (err: any) {
      setError(err.message || 'Error al generar el comunicado. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Report Insight Express</h1>
              <p className="text-primary-100 mt-1">
                Selecciona tu ecosistema y recibe informes personalizados (Fixed Version)
              </p>
            </div>
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
                Ecosistema *
              </label>
              <div className="relative">
                <select
                  value={formData.ecosystem}
                  onChange={(e) => handleInputChange('ecosystem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Selecciona un ecosistema</option>
                  {ecosystems.map((eco) => (
                    <option key={eco} value={eco}>{eco}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El sistema combinará datos del comparado + informe específico del ecosistema (si está disponible)
              </p>
            </div>

            {/* Focus Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus
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
                Fecha
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="mm/dd/yyyy"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Milestone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hito
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
                Email
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
              Generar Comunicado (Fixed)
            </button>
          </form>
        </div>

        {/* Admin Section */}
        <div className="mt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sección Administrativa</h3>
            <p className="text-gray-600 text-sm mb-4">
              Accede al panel de administración para gestionar reportes, contactos y configuraciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/admin"
                className="btn-primary text-center"
              >
                Panel de Control
              </a>
              <a
                href="/admin"
                className="btn-secondary text-center"
              >
                Subir Reportes
              </a>
              <a
                href="/admin"
                className="btn-secondary text-center"
              >
                Buscar Documentos
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
