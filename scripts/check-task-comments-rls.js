#!/usr/bin/env node

/**
 * Script to check task_comments RLS policies and provide guidance
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.log('\n💡 Make sure you have these set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTaskCommentsRLS() {
  console.log('🔍 Checking task_comments RLS policies...\n')

  try {
    // Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'task_comments')
      .single()

    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError)
      return
    }

    console.log('📋 RLS Status:')
    console.log(`   Table: ${rlsStatus.relname}`)
    console.log(`   RLS Enabled: ${rlsStatus.relrowsecurity ? '✅ Yes' : '❌ No'}`)
    console.log('')

    // Check current policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'task_comments'
        ORDER BY cmd, policyname;
      `
    })

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError)
      return
    }

    console.log('📋 Current RLS Policies:')
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`   ${policy.cmd}: ${policy.policyname}`)
        console.log(`      Permissive: ${policy.permissive}`)
        console.log(`      Roles: ${policy.roles}`)
        if (policy.qual) console.log(`      USING: ${policy.qual}`)
        if (policy.with_check) console.log(`      WITH CHECK: ${policy.with_check}`)
        console.log('')
      })
    } else {
      console.log('   ❌ No policies found!')
    }

    // Test comment creation (this will fail but show us the exact error)
    console.log('🧪 Testing comment creation...')
    try {
      const { error: testError } = await supabase
        .from('task_comments')
        .insert({
          task_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          author_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          content: 'Test comment'
        })

      if (testError) {
        console.log('❌ Expected error (this is normal):')
        console.log(`   Code: ${testError.code}`)
        console.log(`   Message: ${testError.message}`)
        console.log('')
      }
    } catch (error) {
      console.log('❌ Test error:', error.message)
    }

    // Provide recommendations
    console.log('💡 Recommendations:')
    console.log('')
    
    if (!rlsStatus.relrowsecurity) {
      console.log('1. ❌ RLS is disabled. Enable it with:')
      console.log('   ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;')
      console.log('')
    }

    if (!policies || policies.length === 0) {
      console.log('2. ❌ No RLS policies found. Create basic policies:')
      console.log('')
      console.log('   -- Allow authenticated users to view comments')
      console.log('   CREATE POLICY "view_comments" ON task_comments')
      console.log('     FOR SELECT TO authenticated USING (true);')
      console.log('')
      console.log('   -- Allow authenticated users to create comments')
      console.log('   CREATE POLICY "create_comments" ON task_comments')
      console.log('     FOR INSERT TO authenticated')
      console.log('     WITH CHECK (auth.uid() = author_id);')
      console.log('')
    }

    console.log('3. 🔧 To fix the current issue, run:')
    console.log('   node scripts/fix-task-comments-rls.js')
    console.log('')
    console.log('4. 📄 Or apply the SQL script manually:')
    console.log('   scripts/fix-task-comments-rls.sql')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkTaskCommentsRLS()
  .then(() => {
    console.log('\n🎉 RLS check completed!')
  })
  .catch((error) => {
    console.error('\n💥 Failed to check RLS policies:', error)
  })