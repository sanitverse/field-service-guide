#!/usr/bin/env node

/**
 * Step-by-step application of role-based workflow changes
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function step1_updateTaskStatus() {
  console.log('Step 1: Adding awaiting_review status to service_tasks...')
  
  // For now, we'll handle this in the application logic
  // The constraint update requires direct database access
  console.log('✅ Status update will be handled in application logic')
  return true
}

async function step2_createTaskHistory() {
  console.log('Step 2: Creating task_history table...')
  
  try {
    // Check if table already exists
    const { data, error } = await supabase
      .from('task_history')
      .select('id')
      .limit(1)
    
    if (!error) {
      console.log('✅ task_history table already exists')
      return true
    }
    
    console.log('⚠️  task_history table needs to be created via Supabase dashboard')
    console.log('   SQL: CREATE TABLE task_history (...)')
    return true
  } catch (error) {
    console.error('❌ Error checking task_history:', error.message)
    return false
  }
}

async function step3_updateTaskComments() {
  console.log('Step 3: Updating task_comments table...')
  
  try {
    // Check if columns exist
    const { data, error } = await supabase
      .from('task_comments')
      .select('author_role, comment_type')
      .limit(1)
    
    if (!error) {
      console.log('✅ task_comments table already updated')
      return true
    }
    
    console.log('⚠️  task_comments table needs column updates via Supabase dashboard')
    console.log('   SQL: ALTER TABLE task_comments ADD COLUMN author_role TEXT...')
    return true
  } catch (error) {
    console.error('❌ Error checking task_comments:', error.message)
    return false
  }
}

async function step4_createTestUsers() {
  console.log('Step 4: Creating test users for role testing...')
  
  try {
    // Create supervisor user
    const { data: supervisor, error: supervisorError } = await supabase.auth.admin.createUser({
      email: 'supervisor@test.com',
      password: 'password123',
      email_confirm: true
    })
    
    if (supervisorError && !supervisorError.message.includes('already registered')) {
      console.error('❌ Failed to create supervisor:', supervisorError.message)
    } else {
      console.log('✅ Supervisor user created/exists')
    }
    
    // Create technician user
    const { data: technician, error: technicianError } = await supabase.auth.admin.createUser({
      email: 'technician@test.com',
      password: 'password123',
      email_confirm: true
    })
    
    if (technicianError && !technicianError.message.includes('already registered')) {
      console.error('❌ Failed to create technician:', technicianError.message)
    } else {
      console.log('✅ Technician user created/exists')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error creating test users:', error.message)
    return false
  }
}

async function step5_updateProfiles() {
  console.log('Step 5: Updating user profiles with roles...')
  
  try {
    // Get existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Failed to list users:', usersError.message)
      return false
    }
    
    // Find supervisor and technician users
    const supervisorUser = users.users.find(u => u.email === 'supervisor@test.com')
    const technicianUser = users.users.find(u => u.email === 'technician@test.com')
    
    if (supervisorUser) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: supervisorUser.id,
          email: 'supervisor@test.com',
          full_name: 'Test Supervisor',
          role: 'supervisor',
          status: 'active'
        })
      
      if (error) {
        console.error('❌ Failed to update supervisor profile:', error.message)
      } else {
        console.log('✅ Supervisor profile updated')
      }
    }
    
    if (technicianUser) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: technicianUser.id,
          email: 'technician@test.com',
          full_name: 'Test Technician',
          role: 'technician',
          status: 'active'
        })
      
      if (error) {
        console.error('❌ Failed to update technician profile:', error.message)
      } else {
        console.log('✅ Technician profile updated')
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Error updating profiles:', error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Role-Based Workflow Step-by-Step Setup')
  console.log('=========================================')
  
  await step1_updateTaskStatus()
  await step2_createTaskHistory()
  await step3_updateTaskComments()
  await step4_createTestUsers()
  await step5_updateProfiles()
  
  console.log('')
  console.log('📋 Next Steps:')
  console.log('1. Apply the full migration via Supabase dashboard or CLI')
  console.log('2. Update the application code to use role-based logic')
  console.log('3. Test the workflow with supervisor@test.com and technician@test.com')
  console.log('')
  console.log('Migration file: supabase/migrations/010_role_based_task_workflow.sql')
}

main().catch(console.error)