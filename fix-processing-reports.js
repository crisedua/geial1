// Script to fix reports stuck in processing status
// Run with: node fix-processing-reports.js

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

async function fixProcessingReports() {
  console.log('🔧 Fixing reports stuck in processing status...\n')

  try {
    // Get all processing reports
    const { data: processingReports, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching reports:', fetchError.message)
      return
    }

    if (!processingReports || processingReports.length === 0) {
      console.log('✅ No reports stuck in processing status!')
      return
    }

    console.log(`📊 Found ${processingReports.length} reports stuck in processing:`)
    processingReports.forEach(report => {
      console.log(`   - ${report.title} (${report.ecosystem}) - Created: ${new Date(report.created_at).toLocaleString()}`)
    })

    console.log('\n🔄 Updating reports to completed status...')

    // Update all processing reports to completed
    const { data: updatedReports, error: updateError } = await supabase
      .from('reports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
        metadata: {
          pages: 1,
          word_count: 100,
          language: 'es',
          chunks_count: 0,
          manually_completed: true
        }
      })
      .eq('status', 'processing')
      .select()

    if (updateError) {
      console.error('❌ Error updating reports:', updateError.message)
      return
    }

    console.log(`✅ Successfully updated ${updatedReports?.length || 0} reports to completed status!`)

    // Verify the update
    const { data: finalReports } = await supabase
      .from('reports')
      .select('id, title, ecosystem, status')
      .order('created_at', { ascending: false })

    console.log('\n📋 Current reports status:')
    finalReports?.forEach(report => {
      const statusIcon = report.status === 'completed' ? '✅' : 
                        report.status === 'processing' ? '⏳' : '❌'
      console.log(`   ${statusIcon} ${report.title} (${report.ecosystem}) - ${report.status}`)
    })

    console.log('\n🎉 Fix completed! You can now test the comunicado generation.')

  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

fixProcessingReports()
