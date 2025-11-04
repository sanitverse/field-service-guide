// Comprehensive setup and test script
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

console.log('🔧 Field Service Guide - Setup & Test Script')
console.log('=' .repeat(50))

// 1. Check Environment Variables
console.log('\n📋 Checking Environment Variables...')
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': supabaseUrl,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': supabaseServiceKey,
  'OPENAI_API_KEY': openaiApiKey,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL
}

let envVarsOk = true
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('KEY') || key.includes('SECRET') ? '***' + value.slice(-4) : value}`)
  } else {
    console.log(`❌ ${key}: Missing`)
    envVarsOk = false
  }
}

if (!envVarsOk) {
  console.log('\n❌ Some environment variables are missing. Please check your .env.local file.')
  process.exit(1)
}

// 2. Test Supabase Connection
console.log('\n🗄️  Testing Supabase Connection...')
const testSupabaseConnection = async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    
    // Check if tables exist
    const tables = ['profiles', 'service_tasks', 'files', 'document_chunks', 'ai_interactions']
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1)
      if (tableError) {
        console.log(`❌ Table '${table}' not found or accessible: ${tableError.message}`)
      } else {
        console.log(`✅ Table '${table}' exists and accessible`)
      }
    }
    
    return true
  } catch (error) {
    console.log(`❌ Supabase connection error: ${error.message}`)
    return false
  }
}

// 3. Test OpenAI API
console.log('\n🤖 Testing OpenAI API...')
const testOpenAIConnection = async () => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.log(`❌ OpenAI API failed: ${errorData.error?.message || response.statusText}`)
      return false
    }
    
    const data = await response.json()
    console.log('✅ OpenAI API connection successful')
    console.log(`✅ Available models: ${data.data.length} models found`)
    
    return true
  } catch (error) {
    console.log(`❌ OpenAI API error: ${error.message}`)
    return false
  }
}

// 4. Test Application APIs
const testApplicationAPIs = async () => {
  console.log('\n🌐 Testing Application APIs...')
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  try {
    // Test Chat API
    console.log('Testing AI Chat API...')
    const chatResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me with field service tasks?',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        conversationHistory: []
      }),
    })

    if (chatResponse.ok) {
      const chatData = await chatResponse.json()
      console.log('✅ AI Chat API working')
      console.log(`   Response: ${chatData.response.substring(0, 100)}...`)
    } else {
      console.log(`❌ AI Chat API failed: ${chatResponse.status}`)
    }

    // Test Task Suggestions API
    console.log('Testing AI Task Suggestions API...')
    const taskResponse = await fetch('http://localhost:3000/api/ai/task-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 'HVAC system needs maintenance in Building A',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        userRole: 'technician',
        existingTasks: []
      }),
    })

    if (taskResponse.ok) {
      const taskData = await taskResponse.json()
      console.log('✅ AI Task Suggestions API working')
      console.log(`   Generated ${taskData.suggestions.length} suggestions`)
    } else {
      console.log(`❌ AI Task Suggestions API failed: ${taskResponse.status}`)
    }

  } catch (error) {
    console.log(`❌ Application API test error: ${error.message}`)
    console.log('   Make sure the development server is running (npm run dev)')
  }
}

// 5. Run All Tests
const runAllTests = async () => {
  const supabaseOk = await testSupabaseConnection()
  const openaiOk = await testOpenAIConnection()
  
  console.log('\n📊 Test Summary:')
  console.log(`Environment Variables: ${envVarsOk ? '✅' : '❌'}`)
  console.log(`Supabase Connection: ${supabaseOk ? '✅' : '❌'}`)
  console.log(`OpenAI API: ${openaiOk ? '✅' : '❌'}`)
  
  if (envVarsOk && supabaseOk && openaiOk) {
    console.log('\n🎉 All core services are configured correctly!')
    console.log('\n🚀 Starting application API tests...')
    await testApplicationAPIs()
  } else {
    console.log('\n⚠️  Some services need attention. Please fix the issues above.')
  }
  
  console.log('\n📝 Next Steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Open: http://localhost:3000')
  console.log('3. Test the AI Assistant at: http://localhost:3000/dashboard/ai-assistant')
}

runAllTests().catch(console.error)