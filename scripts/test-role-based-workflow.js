#!/usr/bin/env node

/**
 * Test script for role-based task workflow
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

async function testSupervisorLogin() {
  console.log('🧪 Testing Supervisor Login...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'supervisor@test.com',
    password: 'password123'
  })
  
  if (error) {
    console.error('❌ Supervisor login failed:', error.message)
    return null
  }
  
  console.log('✅ Supervisor logged in successfully')
  return data.user
}

async function testTechnicianLogin() {
  console.log('🧪 Testing Technician Login...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'technician@test.com',
    password: 'password123'
  })
  
  if (error) {
    console.error('❌ Technician login failed:', error.message)
    return null
  }
  
  console.log('✅ Technician logged in successfully')
  return data.user
}

async function testTaskAccess(userType) {
  console.log(`🧪 Testing ${userType} task access...`)
  
  const { data: tasks, error } = await supabase
    .from('service_tasks')
    .select('*')
  
  if (error) {
    console.log(`❌ ${userType} cannot access tasks:`, error.message)
    return false
  }
  
  console.log(`✅ ${userType} can access ${tasks.length} tasks`)
  return true
}

async function testTaskCreation(userType) {
  console.log(`🧪 Testing ${userType} task creation...`)
  
  const { data, error } = await supabase
    .from('service_tasks')
    .insert({
      title: `Test task by ${userType}`,
      description: 'This is a test task',
      priority: 'medium',
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
  
  if (error) {
    console.log(`❌ ${userType} cannot create tasks:`, error.message)
    return false
  }
  
  console.log(`✅ ${userType} can create tasks`)
  
  // Clean up - delete the test task
  if (data && data[0]) {
    await supabase
      .from('service_tasks')
      .delete()
      .eq('id', data[0].id)
  }
  
  return true
}

async function testProfiles() {
  console.log('🧪 Testing user profiles...')
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('email', ['supervisor@test.com', 'technician@test.com'])
  
  if (error) {
    console.error('❌ Failed to fetch profiles:', error.message)
    return false
  }
  
  console.log('✅ Found profiles:')
  profiles.forEach(profile => {
    console.log(`  - ${profile.email}: ${profile.role} (${profile.status})`)
  })
  
  return true
}

async function main() {
  console.log('🔧 Role-Based Task Workflow Test')
  console.log('================================')
  
  // Test profiles first
  await testProfiles()
  
  console.log('\n--- Testing Supervisor ---')
  const supervisor = await testSupervisorLogin()
  if (supervisor) {
    await testTaskAccess('Supervisor')
    await testTaskCreation('Supervisor')
  }
  
  // Sign out supervisor
  await supabase.auth.signOut()
  
  console.log('\n--- Testing Technician ---')
  const technician = await testTechnicianLogin()
  if (technician) {
    await testTaskAccess('Technician')
    await testTaskCreation('Technician')
  }
  
  // Sign out technician
  await supabase.auth.signOut()
  
  console.log('\n🎉 Role-based workflow testing completed!')
  console.log('\nNext steps:')
  console.log('1. Open the application and test the UI with both user types')
  console.log('2. Verify that Supervisors see all tasks and can create new ones')
  console.log('3. Verify that Technicians only see assigned tasks and cannot create')
  console.log('4. Test the task status workflow (pending → in_progress → awaiting_review → completed)')
}

main().catch(console.error)