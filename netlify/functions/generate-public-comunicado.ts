import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface PublicComunicadoRequest {
  ecosystem: string
  focus?: string
  date?: string
  milestone?: string
  email: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { ecosystem, focus, date, milestone, email }: PublicComunicadoRequest = JSON.parse(event.body || '{}')

    if (!ecosystem || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ecosystem and email are required' })
      }
    }

    // Get reports for the specified ecosystem
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        *,
        chunks (
          content,
          section_type
        )
      `)
      .eq('ecosystem', ecosystem)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    if (reportsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch reports' })
      }
    }

    // If no reports found for the specific ecosystem, get general reports
    let generalReports = []
    if (!reports || reports.length === 0) {
      const { data: generalData } = await supabase
        .from('reports')
        .select(`
          *,
          chunks (
            content,
            section_type
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(3)
      
      generalReports = generalData || []
    }

    const availableReports = reports || generalReports

    if (availableReports.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'No reports available',
          message: 'No hay reportes disponibles para generar el comunicado'
        })
      }
    }

    // Generate comunicado using the available data
    const comunicado = await generatePublicComunicado({
      ecosystem,
      focus,
      date,
      milestone,
      email,
      reports: availableReports
    })

    // Save the request for tracking
    await supabase
      .from('public_requests')
      .insert({
        ecosystem,
        focus,
        date,
        milestone,
        email,
        status: 'completed',
        reports_used: availableReports.map(r => r.id)
      })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        comunicado,
        ecosystem,
        reportsUsed: availableReports.length,
        message: 'Comunicado generado exitosamente'
      })
    }

  } catch (error: any) {
    console.error('Error generating public comunicado:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate comunicado',
        details: error.message
      })
    }
  }
}

async function generatePublicComunicado(data: {
  ecosystem: string
  focus?: string
  date?: string
  milestone?: string
  email: string
  reports: any[]
}): Promise<string> {
  try {
    const systemPrompt = `Eres un experto en comunicación empresarial y análisis de ecosistemas de innovación. Tu tarea es crear un comunicado de prensa profesional basado en los datos disponibles del ecosistema.

Instrucciones:
1. Crea un comunicado de prensa profesional y atractivo
2. Destaca los hallazgos más importantes del ecosistema
3. Usa un tono profesional pero accesible
4. Incluye datos y métricas relevantes cuando estén disponibles
5. Estructura el comunicado con: título, subtítulo, párrafo introductorio, cuerpo principal, y conclusión
6. Mantén el comunicado entre 400-600 palabras
7. Usa lenguaje claro y evita jerga técnica excesiva
8. Incluye llamadas a la acción cuando sea apropiado
9. Si se proporciona un enfoque específico, enfócate en ese tema
10. Si se proporciona una fecha o hito, incorpóralo en el contexto

Formato del comunicado:
- Título llamativo relacionado con el ecosistema
- Subtítulo explicativo
- Párrafo introductorio con el contexto del ecosistema
- Cuerpo principal con hallazgos clave
- Conclusión con próximos pasos o implicaciones`

    const userPrompt = `Ecosistema: ${data.ecosystem}
${data.focus ? `Enfoque: ${data.focus}` : ''}
${data.date ? `Fecha: ${data.date}` : ''}
${data.milestone ? `Hito: ${data.milestone}` : ''}

Datos disponibles de reportes:
${data.reports.map((report, index) => `
Reporte ${index + 1}: ${report.title}
Ecosistema: ${report.ecosystem}
Región: ${report.region}
Fecha: ${new Date(report.created_at).toLocaleDateString()}

Contenido por secciones:
${report.chunks ? report.chunks.map((chunk: any) => `
- ${chunk.section_type}: ${chunk.content.slice(0, 200)}...
`).join('') : 'Sin contenido disponible'}
`).join('\n')}

Por favor, genera un comunicado de prensa profesional basado en esta información del ecosistema ${data.ecosystem}.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || 'Error generating comunicado'
  } catch (error) {
    console.error('Error generating public comunicado:', error)
    throw error
  }
}
