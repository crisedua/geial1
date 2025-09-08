import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface GenerateSummaryRequest {
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
    const { reportId }: GenerateSummaryRequest = JSON.parse(event.body || '{}')

    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report ID is required' })
      }
    }

    // Get report and its chunks
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        chunks (
          content,
          section_type
        )
      `)
      .eq('id', reportId)
      .eq('status', 'completed')
      .single()

    if (reportError || !report) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found or not completed' })
      }
    }

    // Organize chunks by section type
    const chunks = report.chunks || []
    const sections = {
      resumen: chunks.filter((c: any) => c.section_type === 'resumen').map((c: any) => c.content).join('\n'),
      fortalezas: chunks.filter((c: any) => c.section_type === 'fortalezas').map((c: any) => c.content).join('\n'),
      retos: chunks.filter((c: any) => c.section_type === 'retos').map((c: any) => c.content).join('\n'),
      recomendaciones: chunks.filter((c: any) => c.section_type === 'recomendaciones').map((c: any) => c.content).join('\n'),
      métricas: chunks.filter((c: any) => c.section_type === 'métricas').map((c: any) => c.content).join('\n'),
      other: chunks.filter((c: any) => c.section_type === 'other').map((c: any) => c.content).join('\n')
    }

    // Generate executive summary using GPT-4-mini
    const summary = await generateSummary(report, sections)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        content: summary,
        reportTitle: report.title
      })
    }

  } catch (error: any) {
    console.error('Error generating summary:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate summary',
        details: error.message
      })
    }
  }
}

async function generateSummary(report: any, sections: any): Promise<string> {
  try {
    const systemPrompt = `Eres un analista de negocios experto en crear resúmenes ejecutivos. Tu tarea es crear un resumen ejecutivo conciso y profesional basado en el contenido del reporte.

Instrucciones:
1. Crea un resumen ejecutivo de máximo 200 palabras
2. Destaca los puntos más importantes y relevantes
3. Incluye métricas clave cuando estén disponibles
4. Identifica fortalezas, retos y recomendaciones principales
5. Usa un tono profesional y directo
6. Estructura el resumen de manera lógica y fácil de leer
7. Evita jerga técnica excesiva
8. Incluye conclusiones y próximos pasos cuando sea apropiado

Formato del resumen:
- Párrafo introductorio con contexto
- Hallazgos principales
- Métricas clave (si están disponibles)
- Fortalezas identificadas
- Retos principales
- Recomendaciones clave
- Conclusión y próximos pasos`

    const userPrompt = `Reporte: ${report.title}
Ecosistema: ${report.ecosystem}
Región: ${report.region}

Contenido del reporte:

Resumen: ${sections.resumen || 'No disponible'}

Fortalezas: ${sections.fortalezas || 'No disponible'}

Retos: ${sections.retos || 'No disponible'}

Recomendaciones: ${sections.recomendaciones || 'No disponible'}

Métricas: ${sections.métricas || 'No disponible'}

Contenido adicional: ${sections.other || 'No disponible'}

Por favor, genera un resumen ejecutivo profesional basado en esta información.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.5
    })

    return response.choices[0]?.message?.content || 'Error generating summary'
  } catch (error) {
    console.error('Error generating summary:', error)
    throw error
  }
}
