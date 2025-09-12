-- Add prompts table for managing AI prompts
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  max_tokens INTEGER DEFAULT 1500,
  temperature DECIMAL(3,2) DEFAULT 0.3,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the current comunicado prompt
INSERT INTO prompts (name, description, system_prompt, user_prompt_template, model, max_tokens, temperature, active) VALUES (
  'comunicado-generation',
  'Prompt for generating press releases from ecosystem reports',
  'Rol
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
Contacto: {{email}}

IMPORTANTE: Usa todos los datos específicos que encuentres en los reportes. Si hay nombres, cítalos. Si hay cifras, inclúyelas. Si hay eventos, descríbelos. El comunicado debe ser rico en información concreta y específica.',
  'Entradas (exactas)
ecosistema: {{ecosystem}}
focus: {{focus}}
fecha: {{date}}
hito: {{milestone}}
email_contacto: {{email}}

reporte_local (texto completo): {{reporteLocal}}

reporte_comparado (texto completo con todos los ecosistemas): {{reporteComparado}}

Genera el comunicado siguiendo exactamente el formato especificado.',
  'gpt-4o-mini',
  1500,
  0.3,
  true
) ON CONFLICT (name) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  updated_at = timezone('utc'::text, now());

-- Add RLS policies for prompts
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active prompts
CREATE POLICY "Allow public read access to active prompts" ON prompts
  FOR SELECT USING (active = true);

-- Allow all operations for authenticated users (admin access)
CREATE POLICY "Allow full access for authenticated users" ON prompts
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create index for performance
CREATE INDEX IF NOT EXISTS prompts_name_idx ON prompts(name);
CREATE INDEX IF NOT EXISTS prompts_active_idx ON prompts(active);
