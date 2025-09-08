import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface GenerateComunicadoRequest {
  reportIds: string[]
  title: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { reportIds, title }: GenerateComunicadoRequest = JSON.parse(event.body || '{}')

    if (!reportIds || reportIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report IDs are required' })
      }
    }

    if (!title || title.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Title is required' })
      }
    }

    // Get reports and their chunks
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        *,
        chunks (
          content,
          section_type
        )
      `)
      .in('id', reportIds)
      .eq('status', 'completed')

    if (reportsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch reports' })
      }
    }

    if (!reports || reports.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No completed reports found' })
      }
    }

    // Prepare context for AI generation
    const context = reports.map(report => {
      const chunks = report.chunks || []
      const sections = {
        resumen: chunks.filter((c: any) => c.section_type === 'resumen').map((c: any) => c.content).join('\n'),
        fortalezas: chunks.filter((c: any) => c.section_type === 'fortalezas').map((c: any) => c.content).join('\n'),
        retos: chunks.filter((c: any) => c.section_type === 'retos').map((c: any) => c.content).join('\n'),
        recomendaciones: chunks.filter((c: any) => c.section_type === 'recomendaciones').map((c: any) => c.content).join('\n'),
        métricas: chunks.filter((c: any) => c.section_type === 'métricas').map((c: any) => c.content).join('\n')
      }

      return {
        title: report.title,
        ecosystem: report.ecosystem,
        region: report.region,
        sections
      }
    })

    // Generate comunicado using GPT-3.5-turbo
    const comunicado = await generateComunicado(title, context)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        content: comunicado,
        reportCount: reports.length
      })
    }

  } catch (error: any) {
    console.error('Error generating comunicado:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate comunicado',
        details: error.message
      })
    }
  }
}

async function generateComunicado(title: string, context: any[]): Promise<string> {
  try {
    const systemPrompt = `Eres un experto en comunicación empresarial y análisis de reportes. Tu tarea es crear un comunicado de prensa profesional basado en los reportes proporcionados.

Instrucciones:
1. Crea un comunicado de prensa profesional y atractivo
2. Destaca los hallazgos más importantes de los reportes
3. Usa un tono profesional pero accesible
4. Incluye datos y métricas relevantes cuando estén disponibles
5. Estructura el comunicado con: título, subtítulo, párrafo introductorio, cuerpo principal, y conclusión
6. Mantén el comunicado entre 300-500 palabras
7. Usa lenguaje claro y evita jerga técnica excesiva
8. Incluye llamadas a la acción cuando sea apropiado

Formato del comunicado:
- Título llamativo
- Subtítulo explicativo
- Párrafo introductorio con el contexto
- Cuerpo principal con hallazgos clave
- Conclusión con próximos pasos o implicaciones`

    const userPrompt = `Título del comunicado: "${title}"

Contexto de los reportes:
${context.map((report, index) => `
Reporte ${index + 1}: ${report.title}
Ecosistema: ${report.ecosystem}
Región: ${report.region}

Resumen: ${report.sections.resumen || 'No disponible'}
Fortalezas: ${report.sections.fortalezas || 'No disponible'}
Retos: ${report.sections.retos || 'No disponible'}
Recomendaciones: ${report.sections.recomendaciones || 'No disponible'}
Métricas: ${report.sections.métricas || 'No disponible'}
`).join('\n')}

Por favor, genera un comunicado de prensa profesional basado en esta información.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || 'Error generating comunicado'
  } catch (error) {
    console.error('Error generating comunicado:', error)
    throw error
  }
}
