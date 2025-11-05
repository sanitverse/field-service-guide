#!/usr/bin/env node

/**
 * Script to check the current status of role-based workflow implementation
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCurrentStatus() {
  console.log('🔍 Checking current role-based workflow status...')
  console.log('================================================')
  
  try {
    // Check 1: service_tasks table structure
    console.log('1. Checking service_tasks table...')
    const { data: tasks, error: tasksError } = await supabase
      .from('service_tasks')
      .select('status')
      .limit(1)
    
    if (tasksError) {
      console.log('❌ service_tasks table not accessible:', tasksError.message)
    } else {
      console.log('✅ service_tasks table accessible')
    }
    
    // Check 2: task_history table
    console.log('2. Checking task_history table...')
    const { data: history, error: historyError } = await supabase
      .from('task_history')
      .select('id')
      .limit(1)
    
    if (historyError) {
      console.log('❌ task_history table not found - needs to be created')
    } else {
      console.log('✅ task_history table exists')
    }
    
    // Check 3: task_comments table structure
    console.log('3. Checking task_comments table...')
    const { data: comments, error: commentsError } = await supabase
      .from('task_comments')
      .select('author_role, comment_type')
      .limit(1)
    
    if (commentsError) {
      console.log('❌ task_comments table missing new columns - needs update')
    } else {
      console.log('✅ task_comments table has new columns')
    }
    
    // Check 4: Current RLS policies
    console.log('4. Testing current RLS behavior...')
    
    // Try to access tasks without authentication
    const { data: publicTasks, error: publicError } = await supabase
      .from('service_tasks')
      .select('*')
    
    if (publicError) {
      console.log('✅ RLS is enabled - public access blocked')
    } else {
      console.log('⚠️  RLS might not be properly configured - public access allowed')
    }
    
    console.log('')
    console.log('📋 Summary:')
    console.log('- service_tasks: Accessible')
    console.log('- task_history:', historyError ? 'Missing' : 'Exists')
    console.log('- task_comments updates:', commentsError ? 'Missing' : 'Complete')
    console.log('- RLS protection:', publicError ? 'Active' : 'Needs review')
    
    console.log('')
    if (historyError || commentsError) {
      console.log('🔧 Migration needed: Run the role-based workflow migration')
    } else {
      console.log('✅ Role-based workflow appears to be implemented')
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message)
  }
}

checkCurrentStatus()