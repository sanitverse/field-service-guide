/**
 * Script to verify the admin user was created correctly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const ADMIN_EMAIL = 'admin.fieldservice@yopmail.com'

async function verifyAdminUser() {
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

  console.log('🔍 Verifying admin user...')
  console.log(`Email: ${ADMIN_EMAIL}`)

  try {
    // Check Auth user
    console.log('\n📋 Checking Auth user...')
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users.users.find(u => u.email === ADMIN_EMAIL)

    if (!authUser) {
      console.error('❌ User not found in Auth')
      return
    }

    console.log('✅ Auth user found:')
    console.log('  - ID:', authUser.id)
    console.log('  - Email:', authUser.email)
    console.log('  - Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('  - Created:', new Date(authUser.created_at).toLocaleString())
    console.log('  - Last Sign In:', authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never')

    // Check Profile
    console.log('\n📋 Checking Profile...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      console.error('❌ Profile not found:', profileError.message)
      return
    }

    console.log('✅ Profile found:')
    console.log('  - ID:', profile.id)
    console.log('  - Email:', profile.email)
    console.log('  - Full Name:', profile.full_name)
    console.log('  - Role:', profile.role)
    console.log('  - Status:', profile.status)
    console.log('  - Created:', new Date(profile.created_at).toLocaleString())
    console.log('  - Updated:', new Date(profile.updated_at).toLocaleString())

    // Test login
    console.log('\n🔐 Testing login...')
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: 'Admin@12345'
    })

    if (loginError) {
      console.error('❌ Login test failed:', loginError.message)
    } else {
      console.log('✅ Login test successful')
      console.log('  - Access Token:', loginData.session?.access_token ? 'Present' : 'Missing')
      console.log('  - Refresh Token:', loginData.session?.refresh_token ? 'Present' : 'Missing')
      
      // Sign out after test
      await supabaseClient.auth.signOut()
    }

    console.log('\n🎉 Admin user verification complete!')
    console.log('\n📝 Login Credentials:')
    console.log('  Email: admin.fieldservice@yopmail.com')
    console.log('  Password: Admin@12345')
    console.log('  Role: admin')

  } catch (error) {
    console.error('❌ Error verifying admin user:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  verifyAdminUser()
    .then(() => {
      console.log('\n✨ Verification completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyAdminUser }