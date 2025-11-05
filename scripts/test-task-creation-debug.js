const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkpdyveqdhokpfklyggp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGR5dmVxZGhva3Bma2x5Z2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDQ2NjUsImV4cCI6MjA3NzQyMDY2NX0.fZTrH7VNAGI36QVTY90MIQE9Jp76PDMQBwoKE4RzGVo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTaskCreation() {
  console.log('🔍 Testing Task Creation Debug')
  console.log('================================\n')

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing Supabase connection...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1)
    
    if (profileError) {
      console.error('❌ Connection error:', profileError)
      return
    }
    console.log('✅ Connected to Supabase')
    console.log('   Found profiles:', profiles?.length || 0)
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found. Please create a user first.')
      return
    }

    const testUser = profiles[0]
    console.log('   Using test user:', testUser.email, `(${testUser.role})`)

    // Test 2: Try to create a task
    console.log('\n2️⃣ Testing task creation...')
    const taskData = {
      title: 'Test Task - Debug',
      description: 'This is a test task for debugging',
      priority: 'medium',
      status: 'pending',
      created_by: testUser.id,
      assigned_to: null,
      due_date: null,
      location: null
    }

    console.log('   Task data:', JSON.stringify(taskData, null, 2))

    const { data: task, error: taskError } = await supabase
      .from('service_tasks')
      .insert(taskData)
      .select(`
        *,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single()

    if (taskError) {
      console.error('❌ Task creation error:')
      console.error('   Error object:', taskError)
      console.error('   Error message:', taskError.message)
      console.error('   Error details:', taskError.details)
      console.error('   Error hint:', taskError.hint)
      console.error('   Error code:', taskError.code)
      console.error('   Error stringified:', JSON.stringify(taskError, null, 2))
      return
    }

    console.log('✅ Task created successfully!')
    console.log('   Task ID:', task.id)
    console.log('   Task title:', task.title)
    console.log('   Task status:', task.status)

    // Test 3: Clean up - delete the test task
    console.log('\n3️⃣ Cleaning up test task...')
    const { error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', task.id)

    if (deleteError) {
      console.error('⚠️  Could not delete test task:', deleteError.message)
    } else {
      console.log('✅ Test task deleted')
    }

    console.log('\n✅ All tests passed!')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    console.error('   Error type:', typeof err)
    console.error('   Error constructor:', err?.constructor?.name)
    console.error('   Error stringified:', JSON.stringify(err, null, 2))
  }
}

testTaskCreation()
