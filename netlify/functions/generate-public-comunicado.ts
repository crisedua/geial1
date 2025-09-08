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
    const comunicado = await generatePublicComunicado({
      ecosystem,
      focus,
      date,
      milestone,
      email,
      reports: availableReports
    })

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
Eres un asistente especializado en redactar comunicados de prensa breves y ejecutivos usando DOS fuentes internas:
Reporte del ecosistema local (prioritario) y 2) Reporte GEIAL comparado (contexto regional).
No inventes información. Si un dato no está en los reportes, escribe "No especificado".

Reglas de uso de fuentes
Primero extrae métricas, hallazgos y conclusiones del reporte_local (solo del ecosistema ${data.ecosystem}).
Luego complementa con el reporte_comparado buscando solo información del mismo ecosistema y, si es útil, 1 dato regional/latam para contexto.
Cada cifra o hecho relevante debe incluir cita entre paréntesis con página o sección: ej. (p. 52) o (sección "Resultados locales").
Si hay contradicción entre reportes, prioriza el reporte_local y añade: (según Reporte GEIAL comparado, ver p. X).

Estilo y límites
Tono ejecutivo, claro y conciso.
180–220 palabras total.
Evita superlativos no sustentados.
Sustituye muletillas/errores.
Usa "No especificado" cuando falte cualquier dato clave (fecha/hora del hito, métricas, etc.).

Formato de salida (obligatorio)
Devuelve solo texto, sin explicaciones, con este orden:
[${data.ecosystem}, ${fechaFormateada} — TITULAR corto y directo]
(1–12 palabras; opcional: subtítulo de 1 línea)
Párrafo 1 — Qué es GEIAL y conclusión del ecosistema (2–3 oraciones):
1 oración: definición muy breve de GEIAL (1 línea).
1–2 oraciones: conclusión contundente sobre ${data.ecosystem} (fortaleza o reto principal) con cita (p. X).
Párrafo 2 — Desarrollo del focus (2–4 oraciones):
Explica el ${data.focus || 'análisis del ecosistema'} en este ecosistema.
Incluye métricas/datos clave del reporte_local y, si procede, 1 contraste del comparado. Cita páginas.
Si faltan métricas: "No especificado".
Párrafo 3 — Invitación al hito / CTA (1–3 oraciones):
Anuncia ${data.milestone || 'próximas actividades'} (qué, cuándo, quiénes). Si faltan datos: "No especificado".
Llamado a la acción (asistir, inscribirse, descargar).
Contacto de prensa: ${data.email} y "No especificado" para nombre/teléfono si no vienen.`

    const userPrompt = `Entradas (exactas)
ecosistema: ${data.ecosystem}
focus: ${data.focus || 'No especificado'}
fecha: ${data.date || 'No especificado'}
hito: ${data.milestone || 'No especificado'}
email_contacto: ${data.email}

reporte_local (texto completo): ${JSON.stringify(reporteLocal, null, 2)}

reporte_comparado (texto completo con todos los ecosistemas): ${JSON.stringify(reporteComparado, null, 2)}

Genera el comunicado siguiendo exactamente el formato especificado.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || 'Error generating comunicado'
  } catch (error) {
    console.error('Error generating public comunicado:', error)
    throw error
  }
}
