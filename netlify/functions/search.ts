import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface SearchRequest {
  query: string
  ecosystem?: string
  region?: string
  limit?: number
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { query, ecosystem, region, limit = 10 }: SearchRequest = JSON.parse(event.body || '{}')

    if (!query || query.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Search query is required' })
      }
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Build the similarity search query
    let queryBuilder = supabase
      .from('chunks')
      .select(`
        *,
        reports!inner (
          id,
          title,
          ecosystem,
          region,
          created_at,
          status
        )
      `)
      .eq('reports.status', 'completed')
      .not('embedding', 'is', null)

    // Add filters if provided
    if (ecosystem) {
      queryBuilder = queryBuilder.eq('reports.ecosystem', ecosystem)
    }
    if (region) {
      queryBuilder = queryBuilder.eq('reports.region', region)
    }

    // Perform vector similarity search
    const { data: chunks, error } = await queryBuilder
      .rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      })

    if (error) {
      console.error('Search error:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Search failed' })
      }
    }

    // Format results
    const results = chunks?.map((chunk: any) => ({
      chunk: {
        id: chunk.id,
        report_id: chunk.report_id,
        content: chunk.content,
        section_type: chunk.section_type,
        chunk_index: chunk.chunk_index,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        created_at: chunk.created_at
      },
      report: {
        id: chunk.reports.id,
        title: chunk.reports.title,
        ecosystem: chunk.reports.ecosystem,
        region: chunk.reports.region,
        created_at: chunk.reports.created_at,
        status: chunk.reports.status
      },
      similarity: chunk.similarity || 0
    })) || []

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    }

  } catch (error: any) {
    console.error('Search error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Search failed',
        details: error.message
      })
    }
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000)
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}
