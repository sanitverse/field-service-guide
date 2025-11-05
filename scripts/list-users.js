/**
 * Script to list all users in the system
 * Useful for administrative purposes
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function listUsers() {
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

  console.log('👥 Listing all users in the system...\n')

  try {
    // Get all profiles with user info
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('📭 No users found in the system')
      return
    }

    console.log(`📊 Found ${profiles.length} user(s):\n`)

    // Display users in a table format
    console.log('┌─────────────────────────────────────────┬──────────────────────────────────┬─────────────┬──────────┬─────────────────────┐')
    console.log('│ Email                                   │ Full Name                        │ Role        │ Status   │ Created             │')
    console.log('├─────────────────────────────────────────┼──────────────────────────────────┼─────────────┼──────────┼─────────────────────┤')

    profiles.forEach((profile, index) => {
      const email = (profile.email || '').padEnd(39)
      const fullName = (profile.full_name || 'N/A').padEnd(32)
      const role = (profile.role || 'N/A').padEnd(11)
      const status = (profile.status || 'N/A').padEnd(8)
      const created = new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).padEnd(19)

      console.log(`│ ${email} │ ${fullName} │ ${role} │ ${status} │ ${created} │`)
    })

    console.log('└─────────────────────────────────────────┴──────────────────────────────────┴─────────────┴──────────┴─────────────────────┘')

    // Summary by role
    const roleCounts = profiles.reduce((acc, profile) => {
      const role = profile.role || 'unknown'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Summary by Role:')
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} user(s)`)
    })

    // Summary by status
    const statusCounts = profiles.reduce((acc, profile) => {
      const status = profile.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    console.log('\n📊 Summary by Status:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} user(s)`)
    })

    // Check for admin users
    const adminUsers = profiles.filter(p => p.role === 'admin')
    console.log(`\n👑 Admin Users: ${adminUsers.length}`)
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.full_name || 'No name'})`)
    })

  } catch (error) {
    console.error('❌ Error listing users:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  listUsers()
    .then(() => {
      console.log('\n✨ User listing completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 User listing failed:', error)
      process.exit(1)
    })
}

module.exports = { listUsers }