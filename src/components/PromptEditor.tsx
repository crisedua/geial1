import { useState, useEffect } from 'react'
import { Save, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Prompt } from '../types'

export default function PromptEditor() {
  const { getPrompts, createPrompt, updatePrompt, deletePrompt } = useDatabase()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    user_prompt_template: '',
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.3,
    active: true
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err: any) {
      setError('Error loading prompts: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template || '',
      model: prompt.model,
      max_tokens: prompt.max_tokens,
      temperature: prompt.temperature,
      active: prompt.active
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, formData)
        setSuccess('Prompt updated successfully')
      } else {
        await createPrompt(formData)
        setSuccess('Prompt created successfully')
      }
      
      setShowForm(false)
      setEditingPrompt(null)
      resetForm()
      loadPrompts()
    } catch (err: any) {
      setError('Error saving prompt: ' + err.message)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the prompt "${name}"?`)) return

    try {
      await deletePrompt(id)
      setSuccess('Prompt deleted successfully')
      loadPrompts()
    } catch (err: any) {
      setError('Error deleting prompt: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      user_prompt_template: '',
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.3,
      active: true
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingPrompt(null)
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prompt Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Prompt</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Prompt Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingPrompt}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="4000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this prompt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Prompt *
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={12}
                placeholder="Enter the system prompt that defines the AI's role and instructions..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Prompt Template
              </label>
              <textarea
                value={formData.user_prompt_template}
                onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Template for user prompts with {{variables}} for substitution..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Active (prompt can be used)
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingPrompt ? 'Update' : 'Create'} Prompt</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prompts List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Existing Prompts</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {prompts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No prompts found. Create your first prompt to get started.
            </div>
          ) : (
            prompts.map((prompt) => (
              <div key={prompt.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{prompt.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        prompt.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prompt.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {prompt.model}
                      </span>
                    </div>
                    
                    {prompt.description && (
                      <p className="text-gray-600 mt-1">{prompt.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Tokens: {prompt.max_tokens}</span>
                      <span>Temperature: {prompt.temperature}</span>
                      <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
                    </div>

                    {/* System Prompt Preview */}
                    <div className="mt-3">
                      <button
                        onClick={() => setShowSystemPrompt(showSystemPrompt === prompt.id ? false : prompt.id)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showSystemPrompt === prompt.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span>{showSystemPrompt === prompt.id ? 'Hide' : 'Show'} System Prompt</span>
                      </button>
                      
                      {showSystemPrompt === prompt.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                            {prompt.system_prompt}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit prompt"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id, prompt.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete prompt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
