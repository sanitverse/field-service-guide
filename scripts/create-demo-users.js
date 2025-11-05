/**
 * Script to create demo users for quick login
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const demoUsers = [
  {
    email: 'supervisor@company.com',
    password: 'Super123!',
    fullName: 'Demo Supervisor',
    role: 'supervisor'
  },
  {
    email: 'tech@company.com',
    password: 'Tech123!',
    fullName: 'Demo Technician',
    role: 'technician'
  }
]

async function createDemoUsers() {
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

  console.log('🚀 Creating demo users...\n')

  for (const user of demoUsers) {
    console.log(`Creating ${user.role}: ${user.email}`)
    
    try {
      // Create user in Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${user.email} already exists`)
          continue
        }
        throw authError
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          status: 'active'
        })

      if (profileError && profileError.code !== '23505') {
        throw profileError
      }

      console.log(`✅ Created ${user.role}: ${user.email}`)
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message)
    }
  }

  console.log('\n🎉 Demo users creation complete!')
  console.log('\n📝 Available Demo Accounts:')
  console.log('1. Admin: admin.fieldservice@yopmail.com / Admin@12345')
  console.log('2. Supervisor: supervisor@company.com / Super123!')
  console.log('3. Technician: tech@company.com / Tech123!')
}

createDemoUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })