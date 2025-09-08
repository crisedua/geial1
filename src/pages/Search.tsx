import { useState } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { SearchResult } from '../types'
import { Search as SearchIcon, FileText, MapPin, Calendar } from 'lucide-react'

export default function Search() {
  const { searchChunks, getEcosystems } = useDatabase()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [ecosystemFilter, setEcosystemFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [ecosystems, setEcosystems] = useState<Array<{id: string, name: string, region: string}>>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const searchResults = await searchChunks(
        query,
        ecosystemFilter || undefined,
        regionFilter || undefined,
        20
      )
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSectionTypeColor = (sectionType: string) => {
    const colors: Record<string, string> = {
      resumen: 'bg-blue-100 text-blue-800',
      fortalezas: 'bg-green-100 text-green-800',
      retos: 'bg-yellow-100 text-yellow-800',
      recomendaciones: 'bg-purple-100 text-purple-800',
      métricas: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[sectionType] || colors.other
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find specific information across all your reports using AI-powered semantic search
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Ask a question or search for specific information..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ecosystem" className="block text-sm font-medium text-gray-700 mb-2">
                Ecosystem (Optional)
              </label>
              <select
                id="ecosystem"
                value={ecosystemFilter}
                onChange={(e) => setEcosystemFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Ecosystems</option>
                {ecosystems.map((eco) => (
                  <option key={eco.id} value={eco.name}>
                    {eco.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region (Optional)
              </label>
              <input
                type="text"
                id="region"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="input-field"
                placeholder="Filter by region"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Search Results ({results.length})
            </h2>
          </div>

          {results.map((result, index) => (
            <div key={`${result.chunk.id}-${index}`} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <h3 className="font-medium text-gray-900">{result.report.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSectionTypeColor(result.chunk.section_type)}`}>
                    {result.chunk.section_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {result.report.ecosystem} • {result.report.region}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(result.report.created_at)}
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {result.chunk.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && !loading && results.length === 0 && (
        <div className="card text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Search Tips */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Search Tips</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Use natural language questions like "What are the main challenges?"</p>
          <p>• Search for specific metrics, recommendations, or findings</p>
          <p>• Filter by ecosystem or region to narrow results</p>
          <p>• Results are ranked by semantic similarity to your query</p>
        </div>
      </div>
    </div>
  )
}
