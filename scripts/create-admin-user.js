/**
 * Script to create an admin user in the database
 * This script uses Supabase Admin client to create a user and profile
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Admin credentials
const ADMIN_EMAIL = 'admin.fieldservice@yopmail.com'
const ADMIN_PASSWORD = 'Admin@12345'
const ADMIN_FULL_NAME = 'System Administrator'
const ADMIN_ROLE = 'admin'

async function createAdminUser() {
  // Initialize Supabase Admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🚀 Creating admin user...')
  console.log(`Email: ${ADMIN_EMAIL}`)
  console.log(`Role: ${ADMIN_ROLE}`)

  try {
    // Step 1: Create the user in Supabase Auth
    console.log('\n📝 Step 1: Creating user in Supabase Auth...')
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: ADMIN_FULL_NAME,
        role: ADMIN_ROLE
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists in Auth, checking profile...')
        
        // Get existing user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL)
        
        if (existingUser) {
          console.log('✅ Found existing user:', existingUser.id)
          
          // Check if profile exists
          const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', existingUser.id)
            .single()

          if (profileCheckError && profileCheckError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('📝 Creating profile for existing user...')
            await createProfile(supabaseAdmin, existingUser.id, ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_ROLE)
          } else if (existingProfile) {
            console.log('✅ Profile already exists')
            console.log('Profile details:', {
              id: existingProfile.id,
              email: existingProfile.email,
              full_name: existingProfile.full_name,
              role: existingProfile.role,
              status: existingProfile.status
            })
            
            // Update role if needed
            if (existingProfile.role !== ADMIN_ROLE) {
              console.log(`🔄 Updating role from ${existingProfile.role} to ${ADMIN_ROLE}...`)
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ role: ADMIN_ROLE })
                .eq('id', existingUser.id)
              
              if (updateError) {
                console.error('❌ Error updating role:', updateError)
              } else {
                console.log('✅ Role updated successfully')
              }
            }
          }
          
          console.log('\n🎉 Admin user setup complete!')
          console.log('📧 Email:', ADMIN_EMAIL)
          console.log('🔑 Password:', ADMIN_PASSWORD)
          console.log('👤 Role:', ADMIN_ROLE)
          return
        }
      } else {
        throw authError
      }
    }

    if (authUser?.user) {
      console.log('✅ User created successfully in Auth')
      console.log('User ID:', authUser.user.id)

      // Step 2: Create the user profile
      console.log('\n📝 Step 2: Creating user profile...')
      await createProfile(supabaseAdmin, authUser.user.id, ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_ROLE)
    }

    console.log('\n🎉 Admin user created successfully!')
    console.log('📧 Email:', ADMIN_EMAIL)
    console.log('🔑 Password:', ADMIN_PASSWORD)
    console.log('👤 Role:', ADMIN_ROLE)
    console.log('\n💡 You can now log in to the application with these credentials.')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

async function createProfile(supabaseAdmin, userId, email, fullName, role) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: fullName,
      role: role,
      status: 'active'
    })
    .select()
    .single()

  if (profileError) {
    if (profileError.code === '23505') { // Unique constraint violation
      console.log('⚠️  Profile already exists, updating...')
      
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          email: email,
          full_name: fullName,
          role: role,
          status: 'active'
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
      
      console.log('✅ Profile updated successfully')
      return updatedProfile
    } else {
      throw profileError
    }
  }

  console.log('✅ Profile created successfully')
  return profile
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n✨ Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { createAdminUser }