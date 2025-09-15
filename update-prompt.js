import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// You need to set these environment variables or replace with actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePrompt() {
  try {
    console.log('Updating prompt directly...')
    
    // Update the prompt directly
    const { data, error } = await supabase
      .from('prompts')
      .update({
        system_prompt: `Rol
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
TITULAR: [{{ecosystem}} + tema principal del {{focus}}]

PÁRRAFO 1 - Introducción y contexto GEIAL (80-100 palabras):
Explica qué es GEIAL (Grupo de Ecosistemas Inteligentes de LatinoAmerica) y su relevancia. Presenta la conclusión principal sobre {{ecosystem}} con datos específicos del reporte.

PÁRRAFO 2 - Desarrollo del enfoque principal (120-150 palabras):
Desarrolla detalladamente el tema del {{focus}}.
Incluye todas las métricas, datos cuantitativos, rankings y comparaciones encontrados.
Menciona programas específicos, iniciativas y colaboraciones.

PÁRRAFO 3 - Eventos destacados y actividades (100-120 palabras):
Describe eventos específicos mencionados en los reportes.
Incluye fechas, participantes, objetivos y resultados esperados.
Menciona colaboraciones institucionales y alianzas estratégicas.

PÁRRAFO 4 - Proyecciones y llamado a la acción (80-100 palabras):
Presenta las proyecciones y planes futuros encontrados en los reportes.
Anuncia el {{milestone}} con todos los detalles disponibles.
Si se proporciona un testimonio ({{testimonial}}), inclúyelo de manera natural en el comunicado cuando sea relevante.
Contacto: {{email}}

IMPORTANTE: Usa todos los datos específicos que encuentres en los reportes. Si hay nombres, cítalos. Si hay cifras, inclúyelas. Si hay eventos, descríbelos. El comunicado debe ser rico en información concreta y específica. Si se proporciona un testimonio, intégralo de manera natural en el contexto apropiado.

{{DESC_GEIAL}} GEIAL, es el Grupo de Ecosistemas Inteligentes de América Latina, la primera comunidad de ecosistemas de la región que se mide, compara, monitorea y aprende de las experiencias y buenas prácticas de sus miembros y comparte por esa vía información y contactos valiosos. La integran más de 140 actores de más de 50 organizaciones y su plataforma de datos e indicadores, construida en los años 2023-2024, abarca 25 ecosistemas. GEIAL ofrece una brújula para orientar la formulación de mejores estrategias y agendas accionables para el desarrollo de los ecosistemas de emprendimiento dinámico e innovador en la región, aportando evidencias e inteligencia sistémica a los distintos actores, incluyendo a las gobernanzas y a los gobiernos.`,
        user_prompt_template: `Entradas (exactas)
ecosistema: {{ecosystem}}
focus: {{focus}}
fecha: {{date}}
hito: {{milestone}}
email_contacto: {{email}}
testimonio: {{testimonial}}
{{GEIAL}}: Grupo de Ecosistemas Inteligentes de LatinoAmerica (GEIAL)

reporte_local (texto completo): {{reporteLocal}}

reporte_comparado (texto completo con todos los ecosistemas): {{reporteComparado}}

Genera el comunicado siguiendo exactamente el formato especificado.

{{DESC_GEIAL}}`,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'comunicado-generation')
    
    if (error) {
      console.error('Error updating prompt:', error)
      return
    }
    
    console.log('Prompt updated successfully!')
    
    // Verify the update
    const { data: promptData, error: fetchError } = await supabase
      .from('prompts')
      .select('*')
      .eq('name', 'comunicado-generation')
      .single()
    
    if (fetchError) {
      console.error('Error fetching updated prompt:', fetchError)
      return
    }
    
    console.log('Updated prompt verification:')
    console.log('- Name:', promptData.name)
    console.log('- System prompt length:', promptData.system_prompt.length)
    console.log('- User prompt template length:', promptData.user_prompt_template.length)
    console.log('- Contains testimonial placeholder:', promptData.user_prompt_template.includes('{{testimonial}}'))
    console.log('- Contains GEIAL placeholder:', promptData.user_prompt_template.includes('{{GEIAL}}'))
    console.log('- Contains DESC_GEIAL placeholder:', promptData.user_prompt_template.includes('{{DESC_GEIAL}}'))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updatePrompt()
