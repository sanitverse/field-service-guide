const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkpdyveqdhokpfklyggp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGR5dmVxZGhva3Bma2x5Z2dwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NDY2NSwiZXhwIjoyMDc3NDIwNjY1fQ.eaWHZnRXHxZEcKaD8pEcdEA1xMpmCPF1wXcPkKFMIVU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies for service_tasks')
  console.log('==========================================\n')

  try {
    // Check if RLS is enabled
    const { data: tables, error: tablesError } = await supabase
      .rpc('pg_tables')
      .select('*')
      .eq('tablename', 'service_tasks')

    if (tablesError) {
      console.log('⚠️  Could not check table info (this is normal)')
    }

    // Try to get policies using admin client
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'service_tasks')

    if (policiesError) {
      console.log('⚠️  Could not fetch policies directly')
      console.log('   This is normal - policies require special permissions\n')
    } else if (policies) {
      console.log('📋 Found policies:', policies.length)
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`)
      })
      console.log()
    }

    // Test 1: Try to insert a task with service role (bypasses RLS)
    console.log('1️⃣ Testing insert with service role (bypasses RLS)...')
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
      .single()

    if (!profiles) {
      console.log('❌ No profiles found. Create a user first.')
      return
    }

    const testTask = {
      title: 'RLS Test Task',
      description: 'Testing RLS policies',
      priority: 'medium',
      status: 'pending',
      created_by: profiles.id,
      assigned_to: null,
      due_date: null,
      location: null
    }

    const { data: task, error: insertError } = await supabase
      .from('service_tasks')
      .insert(testTask)
      .select()
      .single()

    if (insertError) {
      console.log('❌ Insert failed even with service role!')
      console.log('   Error:', insertError.message)
      console.log('   Details:', insertError.details)
      console.log('   Hint:', insertError.hint)
      console.log('   Code:', insertError.code)
      return
    }

    console.log('✅ Insert successful with service role')
    console.log('   Task ID:', task.id)

    // Clean up
    await supabase.from('service_tasks').delete().eq('id', task.id)
    console.log('✅ Test task deleted\n')

    // Test 2: Check if anon role can insert
    console.log('2️⃣ Checking RLS policies...')
    console.log('   If task creation fails in the app but works here,')
    console.log('   the issue is likely with RLS policies.\n')

    console.log('💡 Recommended RLS Policy for INSERT:')
    console.log('   Policy name: "Users can create tasks"')
    console.log('   Command: INSERT')
    console.log('   Check: auth.uid() = created_by')
    console.log('   Or: true (to allow all authenticated users)\n')

    console.log('📝 To fix RLS issues:')
    console.log('   1. Go to Supabase Dashboard')
    console.log('   2. Navigate to Authentication > Policies')
    console.log('   3. Find service_tasks table')
    console.log('   4. Add INSERT policy for authenticated users')
    console.log('   5. Policy check: auth.uid() = created_by\n')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

checkRLSPolicies()
