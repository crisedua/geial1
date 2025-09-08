import { useState, useEffect } from 'react'
import { 
  FileText, 
  Upload, 
  MapPin, 
  Send, 
  MessageSquare, 
  BarChart3,
  User,
  Settings,
  Search,
  Users
} from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

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

  const stats = [
    { name: 'Total Informes', value: '24', icon: FileText, color: 'text-blue-600' },
    { name: 'Ubicaciones', value: '12', icon: MapPin, color: 'text-green-600' },
    { name: 'Comunicados', value: '8', icon: MessageSquare, color: 'text-purple-600' },
    { name: 'Contactos', value: '156', icon: Users, color: 'text-orange-600' }
  ]

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

            {/* Primary Action Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Upload className="h-4 w-4" />
              <span>Subir Informes</span>
            </button>

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
                <span className="text-sm font-medium text-blue-600">E</span>
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Informe Q4 2024 - Santiago</p>
                      <p className="text-sm text-gray-500">Subido hace 2 horas</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Completado
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-gray-900">Comunicado Fintech LATAM</p>
                      <p className="text-sm text-gray-500">Generado hace 4 horas</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Enviado
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Subir Informes</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 mt-1">Archivos PDF, hasta 10MB</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informes</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">Informe Q4 2024 - Santiago</p>
                    <p className="text-sm text-gray-500">Chile • Santiago • 15/01/2025</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Completado
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add more tab content as needed */}
      </div>
    </div>
  )
}
