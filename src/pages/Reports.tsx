import { useState, useEffect } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Report } from '../types'
import { FileText, Download, Trash2, Eye, Search, Filter } from 'lucide-react'

export default function Reports() {
  const { getReports, deleteReport } = useDatabase()
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ecosystemFilter, setEcosystemFilter] = useState('all')

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await getReports()
        setReports(data)
        setFilteredReports(data)
      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [getReports])

  useEffect(() => {
    let filtered = reports

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.ecosystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.region.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    // Filter by ecosystem
    if (ecosystemFilter !== 'all') {
      filtered = filtered.filter(report => report.ecosystem === ecosystemFilter)
    }

    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, ecosystemFilter])

  const handleDelete = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport(reportId)
        setReports(reports.filter(r => r.id !== reportId))
      } catch (error) {
        console.error('Error deleting report:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const uniqueEcosystems = [...new Set(reports.map(r => r.ecosystem))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all your uploaded reports
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Ecosystems</option>
              {uniqueEcosystems.map(ecosystem => (
                <option key={ecosystem} value={ecosystem}>
                  {ecosystem}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {reports.length === 0 
                ? "Get started by uploading your first report."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {report.ecosystem} • {report.region}
                    </p>
                    <p className="text-xs text-gray-400">
                      Uploaded {new Date(report.created_at).toLocaleDateString()} • 
                      {(report.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      title="View report"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {report.status === 'completed' && (
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Download report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredReports.length} of {reports.length} reports
      </div>
    </div>
  )
}
