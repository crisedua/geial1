export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface Report {
  id: string
  title: string
  ecosystem: string
  region: string
  file_path: string
  file_size: number
  status: 'processing' | 'completed' | 'failed'
  comparado: boolean
  created_at: string
  updated_at: string
  user_id: string | null
  metadata?: {
    pages: number
    word_count: number
    language: string
  }
}

export interface Chunk {
  id: string
  report_id: string
  content: string
  section_type: 'resumen' | 'fortalezas' | 'retos' | 'recomendaciones' | 'métricas' | 'other'
  chunk_index: number
  start_char: number
  end_char: number
  embedding?: number[]
  created_at: string
}

export interface Contact {
  id: string
  name: string
  email: string
  organization: string
  role: string
  ecosystem: string
  region: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Comunicado {
  id: string
  title: string
  content: string
  report_ids: string[]
  status: 'draft' | 'sent'
  created_at: string
  updated_at: string
  user_id: string
}

export interface SearchResult {
  chunk: Chunk
  report: Report
  similarity: number
}

export interface ProcessingStatus {
  id: string
  report_id: string
  status: 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'completed' | 'failed'
  progress: number
  message: string
  created_at: string
  updated_at: string
}

export interface Ecosystem {
  id: string
  name: string
  region: string
  description: string
  created_at: string
}
