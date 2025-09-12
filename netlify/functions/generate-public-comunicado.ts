import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface GeneratePublicComunicadoRequest {
  ecosystem: string
  focus?: string
  date?: string
  milestone?: string
  email: string
}

export const handler: Handler = async (event) => {
  console.log('=== API FUNCTION DEBUG START ===')
  console.log('Event body:', event.body)
  console.log('Event method:', event.httpMethod)

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { ecosystem, focus, date, milestone, email }: GeneratePublicComunicadoRequest = JSON.parse(event.body || '{}')

    console.log('Parsed data:', { ecosystem, focus, date, milestone, email })

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

    // MODIFIED LOGIC: Generate comunicado even without reports
    console.log('Available reports:', availableReports.length)

    // Get the active prompt from database
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('name', 'comunicado-generation')
      .eq('active', true)
      .single()

    if (promptError) {
      console.error('Error fetching prompt:', promptError)
      // Fallback to default prompt if database prompt not found
    }

    // Generate comunicado using the available data (even if no reports)
    console.log('Generating comunicado with data:', { ecosystem, focus, date, milestone, email })
    console.log('Using reports:', availableReports.length, 'reports')
    console.log('Using prompt:', promptData?.name || 'default')
    
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
      reports: availableReports,
      prompt: promptData
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
      reportsUsed: availableReports.length,
      ecosystemInfo: ecosystem
    }

    console.log('Sending response with comunicado length:', comunicado?.length || 0)
    console.log('=== API FUNCTION DEBUG END ===')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(responseData)
    }

  } catch (error: any) {
    console.error('Error in generate-public-comunicado:', error)
    console.error('Error stack:', error.stack)
    console.log('=== API FUNCTION DEBUG END (ERROR) ===')
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
  prompt?: any
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

    // MODIFIED: Handle case when no reports are available
    let reporteLocal = null
    let reporteComparado = null
    
    if (data.reports && data.reports.length > 0) {
      // Separate local and comparative reports
      reporteLocal = data.reports.find(r => r.ecosystem === data.ecosystem) || data.reports[0]
      reporteComparado = data.reports.find(r => r.title.toLowerCase().includes('comparado')) || data.reports[1] || data.reports[0]
    }

    // Use database prompt if available, otherwise fallback to default
    let systemPrompt, userPrompt

    if (data.prompt) {
      systemPrompt = data.prompt.system_prompt
      userPrompt = data.prompt.user_prompt_template
        ?.replace(/\{\{ecosystem\}\}/g, data.ecosystem)
        ?.replace(/\{\{focus\}\}/g, data.focus || 'No especificado')
        ?.replace(/\{\{date\}\}/g, data.date || 'No especificado')
        ?.replace(/\{\{milestone\}\}/g, data.milestone || 'No especificado')
        ?.replace(/\{\{email\}\}/g, data.email)
        ?.replace(/\{\{reporteLocal\}\}/g, reporteLocal ? JSON.stringify(reporteLocal, null, 2) : 'No hay reporte específico disponible para este ecosistema')
        ?.replace(/\{\{reporteComparado\}\}/g, reporteComparado ? JSON.stringify(reporteComparado, null, 2) : 'No hay reporte comparado disponible')
    } else {
      // Fallback to basic prompt when no database prompt is available
      systemPrompt = `Eres un experto en comunicación estratégica especializado en redactar comunicados de prensa para ecosistemas de emprendimiento e innovación.

Genera un comunicado de prensa profesional y atractivo basado en la información proporcionada sobre el ecosistema ${data.ecosystem}.

GEIAL (Grupo de Ecosistemas Inteligentes de LatinoAmerica) es una iniciativa que evalúa y fortalece los ecosistemas de emprendimiento e innovación en América Latina.

Si no hay reportes específicos disponibles, crea un comunicado general que destaque:
1. La importancia del ecosistema ${data.ecosystem} en el contexto de GEIAL y Latinoamérica
2. Las tendencias actuales en este sector
3. La relevancia del enfoque mencionado (si se proporciona)
4. El potencial de crecimiento y desarrollo

El comunicado debe ser profesional, informativo y de aproximadamente 300-400 palabras.`

      userPrompt = `Genera un comunicado de prensa para:
- Ecosistema: ${data.ecosystem}
- Enfoque: ${data.focus || 'Desarrollo del ecosistema'}
- Fecha: ${fechaFormateada}
- Hito/Evento: ${data.milestone || 'Análisis del ecosistema'}
- Contacto: ${data.email}

${reporteLocal ? `Datos del reporte local: ${JSON.stringify(reporteLocal, null, 2)}` : 'No hay reporte específico disponible - usa información general del ecosistema'}

${reporteComparado ? `Datos del reporte comparado: ${JSON.stringify(reporteComparado, null, 2)}` : 'No hay reporte comparado disponible - enfócate en las características propias del ecosistema'}

Crea un comunicado profesional que destaque la importancia de este ecosistema en el contexto de GEIAL (Grupo de Ecosistemas Inteligentes de LatinoAmerica) y el desarrollo regional.`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || 'Error generando comunicado'
  } catch (error) {
    console.error('Error generating comunicado:', error)
    throw error
  }
}
