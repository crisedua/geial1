import React, { createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Report, Chunk, Contact, Comunicado, SearchResult, ProcessingStatus, Ecosystem } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface DatabaseContextType {
  // Reports
  uploadReport: (file: File, title: string, ecosystem: string, comparado?: boolean) => Promise<Report>
  getReports: () => Promise<Report[]>
  getReport: (id: string) => Promise<Report | null>
  deleteReport: (id: string) => Promise<void>
  
  // Chunks and Search
  searchChunks: (query: string, ecosystem?: string, region?: string, limit?: number) => Promise<SearchResult[]>
  getChunksByReport: (reportId: string) => Promise<Chunk[]>
  
  // Contacts
  getContacts: () => Promise<Contact[]>
  createContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  
  // Comunicados
  createComunicado: (comunicado: Omit<Comunicado, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Comunicado>
  getComunicados: () => Promise<Comunicado[]>
  
  // Processing Status
  getProcessingStatus: (reportId: string) => Promise<ProcessingStatus | null>
  
  // Ecosystems
  getEcosystems: () => Promise<Ecosystem[]>
  createEcosystem: (ecosystem: Omit<Ecosystem, 'id' | 'created_at' | 'updated_at'>) => Promise<Ecosystem>
  updateEcosystem: (id: string, updates: Partial<Omit<Ecosystem, 'id' | 'created_at' | 'updated_at'>>) => Promise<Ecosystem>
  deleteEcosystem: (id: string) => Promise<void>
  
  // AI Generation
  generateComunicado: (reportIds: string[], title: string) => Promise<string>
  generateSummary: (reportId: string) => Promise<string>
  
  // Prompt management
  getPrompts: () => Promise<any[]>
  getPromptByName: (name: string) => Promise<any>
  createPrompt: (promptData: any) => Promise<any>
  updatePrompt: (id: string, updates: any) => Promise<any>
  deletePrompt: (id: string) => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {

  const uploadReport = async (file: File, title: string, ecosystem: string, comparado = false): Promise<Report> => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `reports/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create report record
      const { data, error } = await supabase
        .from('reports')
        .insert({
          title,
          ecosystem: comparado ? 'Comparado' : ecosystem,
          region: 'N/A',
          file_path: filePath,
          file_size: file.size,
          status: 'processing',
          comparado,
          user_id: null
        })
        .select()
        .single()

      if (error) throw error

      // Trigger processing
      await fetch('/api/process-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: data.id })
      })

      return data
    } catch (error) {
      throw error
    }
  }

  const getReports = async (): Promise<Report[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const getReport = async (id: string): Promise<Report | null> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  const deleteReport = async (id: string): Promise<void> => {
    // First get the report to get the file path
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete the file from storage if it exists
    if (report?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('reports')
        .remove([report.file_path])
      
      // Log storage error but don't fail the delete operation
      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }
    }

    // Delete the report record (this will cascade delete chunks via foreign key)
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const searchChunks = async (query: string, ecosystem?: string, region?: string, limit = 10): Promise<SearchResult[]> => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ecosystem, region, limit })
    })

    if (!response.ok) throw new Error('Search failed')
    return response.json()
  }

  const getChunksByReport = async (reportId: string): Promise<Chunk[]> => {
    const { data, error } = await supabase
      .from('chunks')
      .select('*')
      .eq('report_id', reportId)
      .order('chunk_index')

    if (error) throw error
    return data || []
  }

  const getContacts = async (): Promise<Contact[]> => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const createContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Contact> => {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteContact = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const createComunicado = async (comunicado: Omit<Comunicado, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Comunicado> => {
    const { data, error } = await supabase
      .from('comunicados')
      .insert(comunicado)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getComunicados = async (): Promise<Comunicado[]> => {
    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const getProcessingStatus = async (reportId: string): Promise<ProcessingStatus | null> => {
    const { data, error } = await supabase
      .from('processing_status')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error) return null
    return data
  }

  const getEcosystems = async (): Promise<Ecosystem[]> => {
    const { data, error } = await supabase
      .from('ecosystems')
      .select('*')
      .order('name')

    if (error) throw error
    
    // Handle missing 'active' column gracefully
    const ecosystems = (data || []).map(eco => ({
      ...eco,
      active: eco.active !== undefined ? eco.active : true,
      updated_at: eco.updated_at || eco.created_at
    }))
    
    return ecosystems
  }

  const createEcosystem = async (ecosystem: Omit<Ecosystem, 'id' | 'created_at' | 'updated_at'>): Promise<Ecosystem> => {
    const insertData: any = {
      name: ecosystem.name,
      region: ecosystem.region,
      description: ecosystem.description
    }
    
    // Only include active if the column exists
    if (ecosystem.active !== undefined) {
      insertData.active = ecosystem.active
    }
    
    const { data, error } = await supabase
      .from('ecosystems')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    
    // Ensure the returned data has the expected structure
    return {
      ...data,
      active: data.active !== undefined ? data.active : true,
      updated_at: data.updated_at || data.created_at
    }
  }

  const updateEcosystem = async (id: string, updates: Partial<Omit<Ecosystem, 'id' | 'created_at' | 'updated_at'>>): Promise<Ecosystem> => {
    const updateData: any = { ...updates }
    
    // Always set updated_at for database consistency
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('ecosystems')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // Ensure the returned data has the expected structure
    return {
      ...data,
      active: data.active !== undefined ? data.active : true,
      updated_at: data.updated_at || data.created_at
    }
  }

  const deleteEcosystem = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('ecosystems')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const generateComunicado = async (reportIds: string[], title: string): Promise<string> => {
    const response = await fetch('/api/generate-comunicado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportIds, title })
    })

    if (!response.ok) throw new Error('Failed to generate comunicado')
    const data = await response.json()
    return data.content
  }

  const generateSummary = async (reportId: string): Promise<string> => {
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId })
    })

    if (!response.ok) throw new Error('Failed to generate summary')
    const data = await response.json()
    return data.content
  }

  // Prompt management functions
  const getPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const getPromptByName = async (name: string) => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('name', name)
      .eq('active', true)
      .single()

    if (error) throw error
    return data
  }

  const createPrompt = async (promptData: {
    name: string
    description?: string
    system_prompt: string
    user_prompt_template?: string
    model?: string
    max_tokens?: number
    temperature?: number
  }) => {
    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updatePrompt = async (id: string, updates: {
    description?: string
    system_prompt?: string
    user_prompt_template?: string
    model?: string
    max_tokens?: number
    temperature?: number
    active?: boolean
  }) => {
    const { data, error } = await supabase
      .from('prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deletePrompt = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const value = {
    uploadReport,
    getReports,
    getReport,
    deleteReport,
    searchChunks,
    getChunksByReport,
    getContacts,
    createContact,
    updateContact,
    deleteContact,
    createComunicado,
    getComunicados,
    getProcessingStatus,
    getEcosystems,
    createEcosystem,
    updateEcosystem,
    deleteEcosystem,
    generateComunicado,
    generateSummary,
    getPrompts,
    getPromptByName,
    createPrompt,
    updatePrompt,
    deletePrompt,
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}
