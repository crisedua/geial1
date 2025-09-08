// Helper script to add all ecosystems to the database
// Run with: node add-ecosystems.js

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ecosystems = [
  { name: 'Argentina - Córdoba capital', region: 'Argentina', description: 'Ecosistema de Córdoba capital' },
  { name: 'Argentina - Rafaela', region: 'Argentina', description: 'Ecosistema de Rafaela' },
  { name: 'Argentina - Rio Cuarto', region: 'Argentina', description: 'Ecosistema de Rio Cuarto' },
  { name: 'Argentina - Villa María', region: 'Argentina', description: 'Ecosistema de Villa María' },
  { name: 'Brasil - San Pablo', region: 'Brasil', description: 'Ecosistema de San Pablo' },
  { name: 'Chile - Antofagasta', region: 'Chile', description: 'Ecosistema de Antofagasta' },
  { name: 'Chile - Concepción', region: 'Chile', description: 'Ecosistema de Concepción' },
  { name: 'Chile - La Serena - Coquimbo', region: 'Chile', description: 'Ecosistema de La Serena - Coquimbo' },
  { name: 'Chile - Santiago', region: 'Chile', description: 'Ecosistema de Santiago' },
  { name: 'Chile - Valparaíso', region: 'Chile', description: 'Ecosistema de Valparaíso' },
  { name: 'Colombia - Barranquilla', region: 'Colombia', description: 'Ecosistema de Barranquilla' },
  { name: 'Colombia - Bogotá', region: 'Colombia', description: 'Ecosistema de Bogotá' },
  { name: 'Colombia - Medellín', region: 'Colombia', description: 'Ecosistema de Medellín' },
  { name: 'México - Ciudad de México', region: 'México', description: 'Ecosistema de Ciudad de México' },
  { name: 'México - Guadalajara', region: 'México', description: 'Ecosistema de Guadalajara' },
  { name: 'Perú - Lima', region: 'Perú', description: 'Ecosistema de Lima' },
  { name: 'Uruguay - Montevideo', region: 'Uruguay', description: 'Ecosistema de Montevideo' }
]

async function addEcosystems() {
  console.log('🌍 Adding ecosystems to database...\n')

  let added = 0
  let skipped = 0

  for (const ecosystem of ecosystems) {
    try {
      const { data, error } = await supabase
        .from('ecosystems')
        .insert({
          name: ecosystem.name,
          region: ecosystem.region,
          description: ecosystem.description,
          active: true
        })
        .select()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⏭️  Skipped: ${ecosystem.name} (already exists)`)
          skipped++
        } else {
          console.error(`❌ Error adding ${ecosystem.name}:`, error.message)
        }
      } else {
        console.log(`✅ Added: ${ecosystem.name}`)
        added++
      }
    } catch (err) {
      console.error(`❌ Error adding ${ecosystem.name}:`, err.message)
    }
  }

  console.log(`\n🎉 Summary:`)
  console.log(`   ✅ Added: ${added} ecosystems`)
  console.log(`   ⏭️  Skipped: ${skipped} ecosystems`)
  console.log(`   📊 Total: ${ecosystems.length} ecosystems`)

  // Verify final count
  const { data: finalCount } = await supabase
    .from('ecosystems')
    .select('id', { count: 'exact' })

  console.log(`   🗄️  Total in database: ${finalCount?.length || 0} ecosystems`)
}

addEcosystems().catch(console.error)
