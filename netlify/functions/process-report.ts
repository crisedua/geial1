import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import pdf from 'pdf-parse'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface ProcessReportRequest {
  reportId: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { reportId }: ProcessReportRequest = JSON.parse(event.body || '{}')

    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report ID is required' })
      }
    }

    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' })
      }
    }

    // Update status to processing
    await supabase
      .from('reports')
      .update({ status: 'processing' })
      .eq('id', reportId)

    // Create processing status record
    await supabase
      .from('processing_status')
      .upsert({
        report_id: reportId,
        status: 'extracting',
        progress: 10,
        message: 'Extracting text from PDF...'
      })

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('reports')
      .download(report.file_path)

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`)
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const pdfData = await pdf(buffer)
    const extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF')
    }

    // Update processing status
    await supabase
      .from('processing_status')
      .upsert({
        report_id: reportId,
        status: 'chunking',
        progress: 30,
        message: 'Chunking text content...'
      })

    // Smart chunking with section detection
    const chunks = await chunkText(extractedText)

    // Update processing status
    await supabase
      .from('processing_status')
      .upsert({
        report_id: reportId,
        status: 'embedding',
        progress: 60,
        message: 'Generating embeddings...'
      })

    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          const embedding = await generateEmbedding(chunk.content)
          return {
            ...chunk,
            embedding,
            chunk_index: index
          }
        } catch (error) {
          console.error(`Error generating embedding for chunk ${index}:`, error)
          return {
            ...chunk,
            chunk_index: index
          }
        }
      })
    )

    // Save chunks to database
    const chunksToInsert = chunksWithEmbeddings.map(chunk => ({
      report_id: reportId,
      content: chunk.content,
      section_type: chunk.section_type,
      chunk_index: chunk.chunk_index,
      start_char: chunk.start_char,
      end_char: chunk.end_char,
      embedding: chunk.embedding
    }))

    const { error: chunksError } = await supabase
      .from('chunks')
      .insert(chunksToInsert)

    if (chunksError) {
      throw new Error(`Failed to save chunks: ${chunksError.message}`)
    }

    // Update report with metadata
    await supabase
      .from('reports')
      .update({
        status: 'completed',
        metadata: {
          pages: pdfData.numpages,
          word_count: extractedText.split(/\s+/).length,
          language: 'es', // Default to Spanish, could be detected
          chunks_count: chunks.length
        }
      })
      .eq('id', reportId)

    // Update processing status to completed
    await supabase
      .from('processing_status')
      .upsert({
        report_id: reportId,
        status: 'completed',
        progress: 100,
        message: 'Processing completed successfully'
      })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Report processed successfully',
        chunksCount: chunks.length,
        wordCount: extractedText.split(/\s+/).length
      })
    }

  } catch (error: any) {
    console.error('Error processing report:', error)

    // Update report status to failed
    if (event.body) {
      const { reportId } = JSON.parse(event.body)
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportId)

      await supabase
        .from('processing_status')
        .upsert({
          report_id: reportId,
          status: 'failed',
          progress: 0,
          message: error.message
        })
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process report',
        details: error.message
      })
    }
  }
}

async function chunkText(text: string) {
  const chunkSize = 1000
  const overlap = 200
  const chunks = []

  // Section detection patterns
  const sectionPatterns = {
    resumen: /resumen|summary|executive summary/i,
    fortalezas: /fortalezas|strengths|ventajas|advantages/i,
    retos: /retos|challenges|desafíos|obstacles/i,
    recomendaciones: /recomendaciones|recommendations|sugerencias|suggestions/i,
    métricas: /métricas|metrics|indicadores|kpis|performance/i
  }

  let currentPos = 0
  let chunkIndex = 0

  while (currentPos < text.length) {
    const endPos = Math.min(currentPos + chunkSize, text.length)
    let chunkText = text.slice(currentPos, endPos)

    // Try to break at sentence boundaries
    if (endPos < text.length) {
      const lastSentenceEnd = chunkText.lastIndexOf('.')
      const lastParagraphEnd = chunkText.lastIndexOf('\n\n')
      const breakPoint = Math.max(lastSentenceEnd, lastParagraphEnd)
      
      if (breakPoint > chunkSize * 0.7) { // Only break if we're not losing too much content
        chunkText = chunkText.slice(0, breakPoint + 1)
        currentPos += breakPoint + 1
      } else {
        currentPos = endPos
      }
    } else {
      currentPos = endPos
    }

    // Detect section type
    let sectionType = 'other'
    for (const [type, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(chunkText)) {
        sectionType = type
        break
      }
    }

    chunks.push({
      content: chunkText.trim(),
      section_type: sectionType,
      start_char: currentPos - chunkText.length,
      end_char: currentPos
    })

    chunkIndex++

    // Move position back for overlap
    if (currentPos < text.length) {
      currentPos -= overlap
    }
  }

  return chunks
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000) // Limit text length for embedding
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}
