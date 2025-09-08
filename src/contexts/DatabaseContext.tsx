import React, { createContext, useContext, useState } from 'react'
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
  uploadReport: (file: File, title: string, ecosystem: string, region: string) => Promise<Report>
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
  
  // AI Generation
  generateComunicado: (reportIds: string[], title: string) => Promise<string>
  generateSummary: (reportId: string) => Promise<string>
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)

  const uploadReport = async (file: File, title: string, ecosystem: string, region: string): Promise<Report> => {
    setLoading(true)
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
          ecosystem,
          region,
          file_path: filePath,
          file_size: file.size,
          status: 'processing'
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
    } finally {
      setLoading(false)
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
    return data || []
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
    generateComunicado,
    generateSummary,
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
