import { useState, useEffect } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Report, Ecosystem } from '../types'
import { BarChart3, TrendingUp, FileText, Users } from 'lucide-react'

export default function Dashboard() {
  const { getReports, getEcosystems } = useDatabase()
  const [reports, setReports] = useState<Report[]>([])
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, ecosystemsData] = await Promise.all([
          getReports(),
          getEcosystems()
        ])
        setReports(reportsData)
        setEcosystems(ecosystemsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getReports, getEcosystems])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const totalReports = reports.length
  const completedReports = reports.filter(r => r.status === 'completed').length
  const processingReports = reports.filter(r => r.status === 'processing').length
  const failedReports = reports.filter(r => r.status === 'failed').length

  // Group reports by ecosystem
  const reportsByEcosystem = reports.reduce((acc, report) => {
    acc[report.ecosystem] = (acc[report.ecosystem] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group reports by region
  const reportsByRegion = reports.reduce((acc, report) => {
    acc[report.region] = (acc[report.region] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Recent activity
  const recentReports = reports
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your business intelligence platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{totalReports}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedReports}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">{processingReports}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">{failedReports}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reports by Ecosystem */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reports by Ecosystem</h2>
          {Object.keys(reportsByEcosystem).length === 0 ? (
            <p className="text-gray-500 text-sm">No reports uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportsByEcosystem).map(([ecosystem, count]) => (
                <div key={ecosystem} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{ecosystem}</span>
                  <span className="text-sm text-gray-500">{count} reports</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports by Region */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reports by Region</h2>
          {Object.keys(reportsByRegion).length === 0 ? (
            <p className="text-gray-500 text-sm">No reports uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportsByRegion).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{region}</span>
                  <span className="text-sm text-gray-500">{count} reports</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        {recentReports.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{report.title}</p>
                  <p className="text-sm text-gray-500">
                    {report.ecosystem} • {report.region} • 
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : report.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
