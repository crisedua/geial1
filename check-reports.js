import { createClient } from '@supabase/supabase-js'

// Using your Supabase credentials
const supabaseUrl = 'https://ccrvlatvsjasjplazzfiz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcnZsYXR2c2phc3BsYXp6Zml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjE0MDIsImV4cCI6MjA3MjM5NzQwMn0.CRWCZioGRTXZhV2IFIa_pJ8rKDUV262VMaGgeRHLQ-E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReports() {
  console.log('=== CHECKING REPORTS IN DATABASE ===')
  
  // Get all reports
  const { data: allReports, error } = await supabase
    .from('reports')
    .select('id, title, ecosystem, region, status, created_at, comparado')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching reports:', error)
    return
  }
  
  console.log(`Total reports in database: ${allReports?.length || 0}`)
  
  if (allReports && allReports.length > 0) {
    console.log('\nAll reports:')
    allReports.forEach((report, index) => {
      console.log(`${index + 1}. ID: ${report.id}`)
      console.log(`   Title: ${report.title}`)
      console.log(`   Ecosystem: ${report.ecosystem}`)
      console.log(`   Region: ${report.region}`)
      console.log(`   Status: ${report.status}`)
      console.log(`   Comparado: ${report.comparado}`)
      console.log(`   Created: ${report.created_at}`)
      console.log('')
    })
    
    // Check chunks for the first report
    if (allReports[0]) {
      console.log(`\n=== CHECKING CHUNKS FOR REPORT: ${allReports[0].title} ===`)
      const { data: chunks, error: chunksError } = await supabase
        .from('chunks')
        .select('id, content, section_type')
        .eq('report_id', allReports[0].id)
        .limit(5)
      
      if (chunksError) {
        console.error('Error fetching chunks:', chunksError)
      } else {
        console.log(`Chunks found: ${chunks?.length || 0}`)
        if (chunks && chunks.length > 0) {
          chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`)
            console.log(`  Section: ${chunk.section_type}`)
            console.log(`  Content preview: ${chunk.content?.substring(0, 200)}...`)
          })
        }
      }
    }
  }
  
  console.log('\n=== END CHECK ===')
}

checkReports().catch(console.error)
