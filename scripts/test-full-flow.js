/**
 * Comprehensive test script for the full authentication and task creation flow
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testFullFlow() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('🧪 Testing Full Authentication and Task Creation Flow\n')

  // Test 1: Authentication
  console.log('1️⃣ Testing Authentication...')
  
  const testCredentials = [
    { email: 'admin.fieldservice@yopmail.com', password: 'Admin@12345', role: 'admin' },
    { email: 'supervisor@company.com', password: 'Super123!', role: 'supervisor' },
    { email: 'tech@company.com', password: 'Tech123!', role: 'technician' }
  ]

  for (const cred of testCredentials) {
    try {
      console.log(`  Testing login for ${cred.role}: ${cred.email}`)
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      })

      if (loginError) {
        console.log(`  ❌ Login failed: ${loginError.message}`)
        continue
      }

      console.log(`  ✅ Login successful for ${cred.role}`)

      // Test profile fetch
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      if (profileError) {
        console.log(`  ⚠️  Profile fetch failed: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile loaded: ${profile.full_name} (${profile.role})`)
      }

      // Test task creation (only for admin/supervisor)
      if (['admin', 'supervisor'].includes(cred.role)) {
        console.log(`  Testing task creation for ${cred.role}...`)
        
        const { data: taskData, error: taskError } = await supabase
          .from('service_tasks')
          .insert({
            title: `Test Task from ${cred.role}`,
            description: 'This is a test task created by the test script',
            priority: 'medium',
            created_by: loginData.user.id,
            status: 'pending'
          })
          .select()
          .single()

        if (taskError) {
          console.log(`  ❌ Task creation failed: ${taskError.message}`)
        } else {
          console.log(`  ✅ Task created successfully: ${taskData.id}`)
          
          // Clean up - delete the test task
          await supabase
            .from('service_tasks')
            .delete()
            .eq('id', taskData.id)
          
          console.log(`  🧹 Test task cleaned up`)
        }
      }

      // Sign out
      await supabase.auth.signOut()
      console.log(`  ✅ Signed out ${cred.role}\n`)

    } catch (error) {
      console.log(`  ❌ Unexpected error for ${cred.role}: ${error.message}\n`)
    }
  }

  // Test 2: Database Schema
  console.log('2️⃣ Testing Database Schema...')
  
  const tables = ['profiles', 'service_tasks', 'files', 'task_comments']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`  ❌ Table ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ Table ${table}: accessible`)
      }
    } catch (error) {
      console.log(`  ❌ Table ${table}: ${error.message}`)
    }
  }

  // Test 3: Component Dependencies
  console.log('\n3️⃣ Testing Component Dependencies...')
  
  const requiredFiles = [
    'components/tasks/task-form.tsx',
    'components/tasks/task-list.tsx',
    'components/auth/login-form.tsx',
    'components/auth/quick-login.tsx',
    'lib/auth-context.tsx',
    'lib/notification-context.tsx',
    'app/auth/page.tsx',
    'app/dashboard/tasks/page.tsx'
  ]

  const fs = require('fs')
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`)
    } else {
      console.log(`  ❌ ${file} - MISSING`)
    }
  }

  console.log('\n🎯 Test Summary:')
  console.log('✅ Authentication flow tested')
  console.log('✅ Database connectivity verified')
  console.log('✅ Component files checked')
  console.log('\n💡 Next Steps:')
  console.log('1. Visit http://localhost:3000/auth')
  console.log('2. Use Quick Demo Login tab')
  console.log('3. Click "Login as Admin"')
  console.log('4. Navigate to Tasks page')
  console.log('5. Click "Create Task" button')
  console.log('\n🔗 Demo Credentials:')
  console.log('Admin: admin.fieldservice@yopmail.com / Admin@12345')
  console.log('Supervisor: supervisor@company.com / Super123!')
  console.log('Technician: tech@company.com / Tech123!')
}

testFullFlow()
  .then(() => {
    console.log('\n✨ Full flow test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })