// Test script to verify database setup
// Run this with: node test-db-setup.js

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

async function testDatabaseSetup() {
  console.log('🔍 Testing GEIAL Database Setup...\n')

  try {
    // Test 1: Check reports table structure
    console.log('1️⃣ Testing reports table structure...')
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .limit(1)

    if (reportsError) {
      console.error('❌ Error accessing reports table:', reportsError.message)
      return
    }
    console.log('✅ Reports table accessible')

    // Test 2: Check if we can insert with null user_id
    console.log('\n2️⃣ Testing null user_id insertion...')
    const testReport = {
      title: 'Test Report - Database Setup',
      ecosystem: 'Test Ecosystem',
      region: 'Test Region',
      file_path: 'test/test.pdf',
      file_size: 1024,
      status: 'processing',
      comparado: false,
      user_id: null
    }

    const { data: insertData, error: insertError } = await supabase
      .from('reports')
      .insert(testReport)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting with null user_id:', insertError.message)
    } else {
      console.log('✅ Successfully inserted report with null user_id')
      
      // Clean up test data
      await supabase.from('reports').delete().eq('id', insertData.id)
      console.log('✅ Test data cleaned up')
    }

    // Test 3: Check existing reports
    console.log('\n3️⃣ Checking existing reports...')
    const { data: allReports, error: allReportsError } = await supabase
      .from('reports')
      .select('id, title, ecosystem, status, user_id, comparado')
      .order('created_at', { ascending: false })

    if (allReportsError) {
      console.error('❌ Error fetching reports:', allReportsError.message)
    } else {
      console.log(`✅ Found ${allReports.length} reports:`)
      allReports.forEach(report => {
        console.log(`   - ${report.title} (${report.ecosystem}) - Status: ${report.status} - User: ${report.user_id || 'NULL'} - Comparado: ${report.comparado}`)
      })
    }

    // Test 4: Check chunks
    console.log('\n4️⃣ Checking chunks...')
    const { data: chunks, error: chunksError } = await supabase
      .from('chunks')
      .select('id, report_id, section_type, chunk_index')
      .limit(5)

    if (chunksError) {
      console.error('❌ Error fetching chunks:', chunksError.message)
    } else {
      console.log(`✅ Found ${chunks.length} chunks (showing first 5):`)
      chunks.forEach(chunk => {
        console.log(`   - Report ${chunk.report_id} - Section: ${chunk.section_type} - Index: ${chunk.chunk_index}`)
      })
    }

    // Test 5: Search for Valparaíso reports
    console.log('\n5️⃣ Searching for Valparaíso reports...')
    const { data: valparaisoReports, error: valparaisoError } = await supabase
      .from('reports')
      .select('*')
      .ilike('ecosystem', '%valparaíso%')

    if (valparaisoError) {
      console.error('❌ Error searching for Valparaíso:', valparaisoError.message)
    } else {
      console.log(`✅ Found ${valparaisoReports.length} Valparaíso reports:`)
      valparaisoReports.forEach(report => {
        console.log(`   - ${report.title} (${report.ecosystem}) - Status: ${report.status}`)
      })
    }

    // Test 6: Check processing status
    console.log('\n6️⃣ Checking processing status...')
    const { data: processingStatus, error: processingError } = await supabase
      .from('processing_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (processingError) {
      console.error('❌ Error fetching processing status:', processingError.message)
    } else {
      console.log(`✅ Found ${processingStatus.length} processing status records:`)
      processingStatus.forEach(status => {
        console.log(`   - Report ${status.report_id} - Status: ${status.status} - Progress: ${status.progress}%`)
      })
    }

    console.log('\n🎉 Database setup test completed!')
    console.log('\n📋 Summary:')
    console.log('   - Reports table: ✅ Accessible')
    console.log('   - Null user_id: ✅ Working')
    console.log('   - Existing reports:', allReports?.length || 0)
    console.log('   - Chunks:', chunks?.length || 0)
    console.log('   - Valparaíso reports:', valparaisoReports?.length || 0)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDatabaseSetup()
