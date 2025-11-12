#!/usr/bin/env node

/**
 * Script to apply task_comments RLS fix directly
 * This uses individual SQL statements instead of exec_sql function
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

async function applyRLSFix() {
  console.log('🔧 Applying task_comments RLS fix...\n')

  const policies = [
    {
      name: 'Drop: Users can view comments for accessible tasks',
      sql: 'DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;'
    },
    {
      name: 'Drop: Users can create comments for accessible tasks',
      sql: 'DROP POLICY IF EXISTS "Users can create comments for accessible tasks" ON task_comments;'
    },
    {
      name: 'Drop: Comment authors can update their comments',
      sql: 'DROP POLICY IF EXISTS "Comment authors can update their comments" ON task_comments;'
    },
    {
      name: 'Drop: Comment authors and admins can delete comments',
      sql: 'DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON task_comments;'
    },
    {
      name: 'Create: Authenticated users can view task comments',
      sql: `CREATE POLICY "Authenticated users can view task comments" ON task_comments
        FOR SELECT TO authenticated USING (true);`
    },
    {
      name: 'Create: Authenticated users can create task comments',
      sql: `CREATE POLICY "Authenticated users can create task comments" ON task_comments
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);`
    },
    {
      name: 'Create: Users can update their own comments',
      sql: `CREATE POLICY "Users can update their own comments" ON task_comments
        FOR UPDATE TO authenticated 
        USING (auth.uid() = author_id) 
        WITH CHECK (auth.uid() = author_id);`
    },
    {
      name: 'Create: Users can delete their own comments',
      sql: `CREATE POLICY "Users can delete their own comments" ON task_comments
        FOR DELETE TO authenticated USING (auth.uid() = author_id);`
    }
  ]

  for (const policy of policies) {
    console.log(`📝 ${policy.name}...`)
    
    const { error } = await supabase.rpc('exec', { sql: policy.sql })
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      // Continue with other policies even if one fails
    } else {
      console.log(`   ✅ Success`)
    }
  }

  console.log('\n✅ RLS fix application completed!')
  console.log('\n💡 Note: If you see errors about policies not existing, that\'s normal.')
  console.log('   The important part is that the CREATE POLICY statements succeed.')
  console.log('\n🧪 Test by creating a comment in the application.')
}

applyRLSFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Failed:', error)
    process.exit(1)
  })
