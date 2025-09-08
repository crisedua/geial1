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
  console.log('=== API FUNCTION DEBUG START ===')
  console.log('HTTP Method:', event.httpMethod)
  console.log('Event body:', event.body)
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const requestData = JSON.parse(event.body || '{}')
    console.log('Parsed request data:', requestData)
    
    const { ecosystem, focus, date, milestone, email }: PublicComunicadoRequest = requestData
    console.log('Extracted fields:', { ecosystem, focus, date, milestone, email })

    if (!ecosystem || !email) {
      console.log('Validation failed - missing required fields')
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ecosystem and email are required' })
      }
    }

    // Get reports for the specified ecosystem with flexible matching
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        *,
        chunks (
          content,
          section_type
        )
      `)
      .ilike('ecosystem', `%${ecosystem}%`)
      .in('status', ['completed', 'processing'])
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Searching for ecosystem:', ecosystem)
    console.log('Found reports:', reports?.length || 0)

    if (reportsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch reports' })
      }
    }

    // If no reports found for the specific ecosystem, get general reports
    let generalReports = []
    if (!reports || reports.length === 0) {
      console.log('No specific ecosystem reports found, trying general reports...')
      
      const { data: generalData } = await supabase
        .from('reports')
        .select(`
          *,
          chunks (
            content,
            section_type
          )
        `)
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false })
        .limit(3)
      
      generalReports = generalData || []
      console.log('Found general reports:', generalReports.length)
      
      // If still no reports, check what reports exist in the database
      if (generalReports.length === 0) {
        const { data: allReports } = await supabase
          .from('reports')
          .select('id, title, ecosystem, status')
          .order('created_at', { ascending: false })
          .limit(10)
        
        console.log('All reports in database:', allReports)
      }
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
    console.log('Generating comunicado with data:', { ecosystem, focus, date, milestone, email })
    console.log('Using reports:', availableReports.length, 'reports')
    
    // Debug: Log what reports we're actually using
    availableReports.forEach((report, index) => {
      console.log(`Report ${index + 1}:`, {
        id: report.id,
        title: report.title,
        ecosystem: report.ecosystem,
        status: report.status,
        chunks_count: report.chunks?.length || 0
      })
      
      if (report.chunks && report.chunks.length > 0) {
        console.log(`  First chunk preview:`, report.chunks[0].content?.substring(0, 150) + '...')
      }
    })
    
    const comunicado = await generatePublicComunicado({
      ecosystem,
      focus,
      date,
      milestone,
      email,
      reports: availableReports
    })
    
    console.log('Generated comunicado length:', comunicado?.length || 0)
    console.log('Generated comunicado preview:', comunicado?.substring(0, 200) + '...')
    console.log('Full generated comunicado:', comunicado)

    // Save the comunicado to the database
    const { data: comunicadoData, error: comunicadoError } = await supabase
      .from('comunicados')
      .insert({
        title: `Comunicado ${ecosystem} - ${new Date().toLocaleDateString()}`,
        content: comunicado,
        report_ids: availableReports.map(r => r.id),
        status: 'draft',
        user_id: null
      })
      .select()
      .single()

    if (comunicadoError) {
      console.error('Error saving comunicado to database:', comunicadoError)
    } else {
      console.log('Comunicado saved to database successfully:', comunicadoData?.id)
    }

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

    const responseData = {
      success: true,
      comunicado,
      ecosystem,
      reportsUsed: availableReports.length,
      message: 'Comunicado generado exitosamente'
    }
    
    console.log('Returning response data:', {
      ...responseData,
      comunicado: responseData.comunicado?.substring(0, 100) + '...'
    })
    console.log('=== API FUNCTION DEBUG END ===')

    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
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
    // Normalize fecha to DD/MM/AAAA format
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return 'No especificado'
      
      try {
        let date: Date
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/')
          if (parts[0].length === 4) {
            date = new Date(parts[0], parts[1] - 1, parts[2])
          } else if (parts[1].length === 4) {
            date = new Date(parts[2], parts[1] - 1, parts[0])
          } else {
            date = new Date(parts[2], parts[0] - 1, parts[1])
          }
        } else if (dateStr.includes('-')) {
          date = new Date(dateStr)
        } else {
          return 'No especificado'
        }
        
        if (isNaN(date.getTime())) return 'No especificado'
        
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return 'No especificado'
      }
    }

    const fechaFormateada = formatDate(data.date || '')

    // Separate local and comparative reports
    const reporteLocal = data.reports.find(r => r.ecosystem === data.ecosystem) || data.reports[0]
    const reporteComparado = data.reports.find(r => r.title.toLowerCase().includes('comparado')) || data.reports[1] || data.reports[0]

    const systemPrompt = `Rol
Eres un experto en comunicación estratégica especializado en redactar comunicados de prensa detallados y profesionales para ecosistemas de emprendimiento e innovación. Usa DOS fuentes principales:
1) Reporte del ecosistema local específico (prioritario)
2) Reporte GEIAL comparado (contexto regional y benchmarking)

Extrae TODA la información relevante de los reportes. No inventes datos, pero sí extrae y presenta todos los datos, métricas, eventos, iniciativas, nombres, citas y detalles específicos que encuentres.

Reglas de extracción de datos
- Busca y extrae TODOS los datos específicos: métricas, rankings, porcentajes, números, fechas, eventos
- Incluye nombres de personas, organizaciones, programas e iniciativas mencionados
- Extrae citas textuales y declaraciones importantes
- Busca información sobre: MIT REAP, eventos específicos, mediciones GEIAL, proyecciones futuras
- Identifica colaboraciones, alianzas estratégicas y proyectos clave
- Encuentra datos comparativos con otros ecosistemas latinoamericanos

Estructura del comunicado (400-600 palabras)
TITULAR: [${data.ecosystem} + tema principal del ${data.focus || 'ecosistema'}]

PÁRRAFO 1 - Introducción y contexto GEIAL (80-100 palabras):
Explica qué es GEIAL y su relevancia. Presenta la conclusión principal sobre ${data.ecosystem} con datos específicos del reporte.

PÁRRAFO 2 - Desarrollo del enfoque principal (120-150 palabras):
Desarrolla detalladamente el tema del ${data.focus || 'análisis del ecosistema'}.
Incluye todas las métricas, datos cuantitativos, rankings y comparaciones encontrados.
Menciona programas específicos, iniciativas y colaboraciones.

PÁRRAFO 3 - Eventos destacados y actividades (100-120 palabras):
Describe eventos específicos mencionados en los reportes.
Incluye fechas, participantes, objetivos y resultados esperados.
Menciona colaboraciones institucionales y alianzas estratégicas.

PÁRRAFO 4 - Proyecciones y llamado a la acción (80-100 palabras):
Presenta las proyecciones y planes futuros encontrados en los reportes.
Anuncia el ${data.milestone || 'próximo hito'} con todos los detalles disponibles.
Contacto: ${data.email}

IMPORTANTE: Usa todos los datos específicos que encuentres en los reportes. Si hay nombres, cítalos. Si hay cifras, inclúyelas. Si hay eventos, descríbelos. El comunicado debe ser rico en información concreta y específica.`

    const userPrompt = `Entradas (exactas)
ecosistema: ${data.ecosystem}
focus: ${data.focus || 'No especificado'}
fecha: ${data.date || 'No especificado'}
hito: ${data.milestone || 'No especificado'}
email_contacto: ${data.email}

reporte_local (texto completo): ${JSON.stringify(reporteLocal, null, 2)}

reporte_comparado (texto completo con todos los ecosistemas): ${JSON.stringify(reporteComparado, null, 2)}

Genera el comunicado siguiendo exactamente el formato especificado.`

    console.log('=== AI PROMPT DEBUG ===')
    console.log('System prompt length:', systemPrompt.length)
    console.log('User prompt length:', userPrompt.length)
    console.log('reporteLocal data:', {
      id: reporteLocal?.id,
      title: reporteLocal?.title,
      ecosystem: reporteLocal?.ecosystem,
      chunks_count: reporteLocal?.chunks?.length || 0
    })
    console.log('reporteComparado data:', {
      id: reporteComparado?.id,
      title: reporteComparado?.title,
      ecosystem: reporteComparado?.ecosystem,
      chunks_count: reporteComparado?.chunks?.length || 0
    })
    
    if (reporteLocal?.chunks && reporteLocal.chunks.length > 0) {
      console.log('reporteLocal first chunk:', reporteLocal.chunks[0].content?.substring(0, 200) + '...')
    } else {
      console.log('reporteLocal has no chunks!')
    }
    
    if (reporteComparado?.chunks && reporteComparado.chunks.length > 0) {
      console.log('reporteComparado first chunk:', reporteComparado.chunks[0].content?.substring(0, 200) + '...')
    } else {
      console.log('reporteComparado has no chunks!')
    }
    console.log('=== END AI PROMPT DEBUG ===')
    
    console.log('Making OpenAI API call...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || 'Error generating comunicado'
  } catch (error) {
    console.error('Error generating public comunicado:', error)
    throw error
  }
}
