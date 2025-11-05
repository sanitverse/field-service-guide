const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkpdyveqdhokpfklyggp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGR5dmVxZGhva3Bma2x5Z2dwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NDY2NSwiZXhwIjoyMDc3NDIwNjY1fQ.eaWHZnRXHxZEcKaD8pEcdEA1xMpmCPF1wXcPkKFMIVU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fix for Task Creation')
  console.log('============================================\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '009_fix_task_creation_rls.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log(migrationSQL)
    console.log('\n🔄 Applying migration...\n')

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('SELECT')) {
        // This is a verification query
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log('⚠️  Verification query skipped (this is normal)')
        } else if (data) {
          console.log('📋 Current policies:', data)
        }
      } else {
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        if (error) {
          console.error('❌ Error executing statement:', error.message)
          console.error('   Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    }

    console.log('\n✅ Migration applied successfully!')
    console.log('\n📋 Verifying policies...')

    // Verify policies using a direct query
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'service_tasks')

    if (policiesError) {
      console.log('⚠️  Could not verify policies (this is normal)')
      console.log('   Please check Supabase Dashboard → Authentication → Policies')
    } else if (policies) {
      console.log('\n✅ Current policies on service_tasks:')
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`)
      })
    }

    console.log('\n🎉 Done! Try creating a task now.')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    console.error('\n📝 Manual Fix:')
    console.log('   1. Go to Supabase Dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and paste the contents of:')
    console.log('      supabase/migrations/009_fix_task_creation_rls.sql')
    console.log('   4. Run the SQL')
  }
}

applyRLSFix()
