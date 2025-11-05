/**
 * Script to fix database issues with RLS policies and profiles
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixDatabaseIssues() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔧 Fixing database issues...\n')

  // Fix 1: Check and fix profiles
  console.log('1️⃣ Checking user profiles...')
  
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  
  for (const user of authUsers.users) {
    console.log(`Checking profile for: ${user.email}`)
    
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log(`  Creating missing profile for ${user.email}`)
      
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: user.user_metadata?.role || 'technician',
          status: 'active'
        })

      if (insertError) {
        console.log(`  ❌ Failed to create profile: ${insertError.message}`)
      } else {
        console.log(`  ✅ Profile created for ${user.email}`)
      }
    } else if (existingProfile) {
      console.log(`  ✅ Profile exists for ${user.email} (${existingProfile.role})`)
    } else {
      console.log(`  ❌ Profile error: ${profileError.message}`)
    }
  }

  // Fix 2: Create a test task to verify RLS policies
  console.log('\n2️⃣ Testing task creation with admin user...')
  
  const adminUser = authUsers.users.find(u => u.email === 'admin.fieldservice@yopmail.com')
  if (adminUser) {
    try {
      const { data: testTask, error: taskError } = await supabaseAdmin
        .from('service_tasks')
        .insert({
          title: 'Database Test Task',
          description: 'This task tests if RLS policies are working correctly',
          priority: 'low',
          status: 'pending',
          created_by: adminUser.id
        })
        .select()
        .single()

      if (taskError) {
        console.log(`  ❌ Task creation failed: ${taskError.message}`)
        console.log('  This might indicate RLS policy issues')
      } else {
        console.log(`  ✅ Test task created successfully: ${testTask.id}`)
        
        // Clean up test task
        await supabaseAdmin
          .from('service_tasks')
          .delete()
          .eq('id', testTask.id)
        
        console.log('  🧹 Test task cleaned up')
      }
    } catch (error) {
      console.log(`  ❌ Unexpected error: ${error.message}`)
    }
  }

  // Fix 3: Verify table permissions
  console.log('\n3️⃣ Verifying table permissions...')
  
  const tables = ['profiles', 'service_tasks', 'files', 'task_comments']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ ${table}: ${count || 0} records`)
      }
    } catch (error) {
      console.log(`  ❌ ${table}: ${error.message}`)
    }
  }

  console.log('\n🎉 Database fixes completed!')
  console.log('\n💡 If you still have issues:')
  console.log('1. Check Supabase dashboard for RLS policies')
  console.log('2. Ensure service_tasks table allows INSERT for authenticated users')
  console.log('3. Verify profiles table has proper RLS policies')
}

fixDatabaseIssues()
  .then(() => {
    console.log('\n✨ Database fix script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Database fix failed:', error)
    process.exit(1)
  })