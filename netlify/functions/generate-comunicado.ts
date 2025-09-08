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
  ecosystem?: string
  focus?: string
  fecha?: string
  hito?: string
  email_contacto?: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { 
      reportIds, 
      title, 
      ecosystem, 
      focus, 
      fecha, 
      hito, 
      email_contacto 
    }: GenerateComunicadoRequest = JSON.parse(event.body || '{}')

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

    // Generate comunicado using GPT-4-mini with new Spanish prompt
    const comunicado = await generateComunicado({
      title,
      ecosystem: ecosystem || 'No especificado',
      focus: focus || 'No especificado',
      fecha: fecha || 'No especificado',
      hito: hito || 'No especificado',
      email_contacto: email_contacto || 'No especificado',
      context
    })

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

async function generateComunicado(params: {
  title: string
  ecosystem: string
  focus: string
  fecha: string
  hito: string
  email_contacto: string
  context: any[]
}): Promise<string> {
  try {
    const { title, ecosystem, focus, fecha, hito, email_contacto, context } = params

    // Normalize fecha to DD/MM/AAAA format
    const formatDate = (dateStr: string): string => {
      if (dateStr === 'No especificado') return 'No especificado'
      
      try {
        // Try different date formats
        let date: Date
        if (dateStr.includes('/')) {
          // DD/MM/AAAA or MM/DD/YYYY
          const parts = dateStr.split('/')
          if (parts[0].length === 4) {
            // YYYY/MM/DD
            date = new Date(parts[0], parts[1] - 1, parts[2])
          } else if (parts[1].length === 4) {
            // DD/MM/YYYY
            date = new Date(parts[2], parts[1] - 1, parts[0])
          } else {
            // MM/DD/YYYY
            date = new Date(parts[2], parts[0] - 1, parts[1])
          }
        } else if (dateStr.includes('-')) {
          // YYYY-MM-DD
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

    const fechaFormateada = formatDate(fecha)

    // Separate local and comparative reports
    const reporteLocal = context.find(r => r.ecosystem === ecosystem) || context[0]
    const reporteComparado = context.find(r => r.title.toLowerCase().includes('comparado')) || context[1] || context[0]

    const systemPrompt = `Rol
Eres un asistente especializado en redactar comunicados de prensa breves y ejecutivos usando DOS fuentes internas:
Reporte del ecosistema local (prioritario) y 2) Reporte GEIAL comparado (contexto regional).
No inventes información. Si un dato no está en los reportes, escribe "No especificado".

Reglas de uso de fuentes
Primero extrae métricas, hallazgos y conclusiones del reporte_local (solo del ecosistema ${ecosystem}).
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
[${ecosystem}, ${fechaFormateada} — TITULAR corto y directo]
(1–12 palabras; opcional: subtítulo de 1 línea)
Párrafo 1 — Qué es GEIAL y conclusión del ecosistema (2–3 oraciones):
1 oración: definición muy breve de GEIAL (1 línea).
1–2 oraciones: conclusión contundente sobre ${ecosystem} (fortaleza o reto principal) con cita (p. X).
Párrafo 2 — Desarrollo del focus (2–4 oraciones):
Explica el ${focus} en este ecosistema.
Incluye métricas/datos clave del reporte_local y, si procede, 1 contraste del comparado. Cita páginas.
Si faltan métricas: "No especificado".
Párrafo 3 — Invitación al hito / CTA (1–3 oraciones):
Anuncia ${hito} (qué, cuándo, quiénes). Si faltan datos: "No especificado".
Llamado a la acción (asistir, inscribirse, descargar).
Contacto de prensa: ${email_contacto} y "No especificado" para nombre/teléfono si no vienen.`

    const userPrompt = `Entradas (exactas)
ecosistema: ${ecosystem}
focus: ${focus}
fecha: ${fecha}
hito: ${hito}
email_contacto: ${email_contacto}

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
    console.error('Error generating comunicado:', error)
    throw error
  }
}
