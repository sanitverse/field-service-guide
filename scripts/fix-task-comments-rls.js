#!/usr/bin/env node

/**
 * Script to fix task_comments RLS policies
 * This script will update the RLS policies to allow authenticated users to create comments
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixTaskCommentsRLS() {
  console.log('🔧 Fixing task_comments RLS policies...')

  try {
    // Drop existing policies
    console.log('📝 Dropping existing policies...')
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;
      DROP POLICY IF EXISTS "Users can create comments for accessible tasks" ON task_comments;
      DROP POLICY IF EXISTS "Comment authors can update their comments" ON task_comments;
      DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON task_comments;
    `
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies })
    if (dropError) {
      console.error('❌ Error dropping policies:', dropError)
      return
    }

    // Create new policies
    console.log('📝 Creating new policies...')
    const createPolicies = `
      -- Allow authenticated users to view all comments
      CREATE POLICY "Authenticated users can view task comments" ON task_comments
        FOR SELECT
        TO authenticated
        USING (true);

      -- Allow authenticated users to create comments on any task
      CREATE POLICY "Authenticated users can create task comments" ON task_comments
        FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = author_id
        );

      -- Allow users to update their own comments
      CREATE POLICY "Users can update their own comments" ON task_comments
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = author_id)
        WITH CHECK (auth.uid() = author_id);

      -- Allow users to delete their own comments
      CREATE POLICY "Users can delete their own comments" ON task_comments
        FOR DELETE
        TO authenticated
        USING (auth.uid() = author_id);
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies })
    if (createError) {
      console.error('❌ Error creating policies:', createError)
      return
    }

    // Verify policies
    console.log('🔍 Verifying policies...')
    const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies
        WHERE tablename = 'task_comments'
        ORDER BY cmd, policyname;
      `
    })

    if (verifyError) {
      console.error('❌ Error verifying policies:', verifyError)
      return
    }

    console.log('✅ Task comments RLS policies updated successfully!')
    console.log('📋 Current policies:')
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`   - ${policy.cmd}: ${policy.policyname}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixTaskCommentsRLS()
  .then(() => {
    console.log('🎉 RLS fix completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to fix RLS policies:', error)
    process.exit(1)
  })