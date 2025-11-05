/**
 * Admin Tools Script
 * Comprehensive script for managing users and system administration
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

class AdminTools {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  async createUser(email, password, fullName, role = 'technician') {
    console.log(`🚀 Creating user: ${email} with role: ${role}`)

    try {
      // Create user in Auth
      const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log('⚠️  User already exists')
          return null
        }
        throw authError
      }

      // Create profile
      const { data: profile, error: profileError } = await this.supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email,
          full_name: fullName,
          role,
          status: 'active'
        })
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      console.log('✅ User created successfully')
      return { authUser: authUser.user, profile }
    } catch (error) {
      console.error('❌ Error creating user:', error.message)
      return null
    }
  }

  async updateUserRole(email, newRole) {
    console.log(`🔄 Updating role for ${email} to ${newRole}`)

    try {
      const { data: profile, error } = await this.supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('email', email)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Role updated successfully')
      return profile
    } catch (error) {
      console.error('❌ Error updating role:', error.message)
      return null
    }
  }

  async deactivateUser(email) {
    console.log(`🚫 Deactivating user: ${email}`)

    try {
      // Get user ID
      const { data: profile } = await this.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) {
        console.error('❌ User not found')
        return false
      }

      // Update profile status
      await this.supabaseAdmin
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('email', email)

      // Disable auth user
      await this.supabaseAdmin.auth.admin.updateUserById(profile.id, {
        ban_duration: 'none', // Permanent ban
      })

      console.log('✅ User deactivated successfully')
      return true
    } catch (error) {
      console.error('❌ Error deactivating user:', error.message)
      return false
    }
  }

  async reactivateUser(email) {
    console.log(`✅ Reactivating user: ${email}`)

    try {
      // Get user ID
      const { data: profile } = await this.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) {
        console.error('❌ User not found')
        return false
      }

      // Update profile status
      await this.supabaseAdmin
        .from('profiles')
        .update({ status: 'active' })
        .eq('email', email)

      // Enable auth user
      await this.supabaseAdmin.auth.admin.updateUserById(profile.id, {
        ban_duration: '0s', // Remove ban
      })

      console.log('✅ User reactivated successfully')
      return true
    } catch (error) {
      console.error('❌ Error reactivating user:', error.message)
      return false
    }
  }

  async resetUserPassword(email, newPassword) {
    console.log(`🔑 Resetting password for: ${email}`)

    try {
      // Get user ID
      const { data: profile } = await this.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) {
        console.error('❌ User not found')
        return false
      }

      // Update password
      const { error } = await this.supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password: newPassword
      })

      if (error) {
        throw error
      }

      console.log('✅ Password reset successfully')
      return true
    } catch (error) {
      console.error('❌ Error resetting password:', error.message)
      return false
    }
  }

  async getSystemStats() {
    console.log('📊 Gathering system statistics...')

    try {
      // User stats
      const { data: profiles } = await this.supabaseAdmin
        .from('profiles')
        .select('role, status')

      const userStats = profiles.reduce((acc, profile) => {
        acc.total++
        acc.byRole[profile.role] = (acc.byRole[profile.role] || 0) + 1
        acc.byStatus[profile.status] = (acc.byStatus[profile.status] || 0) + 1
        return acc
      }, { total: 0, byRole: {}, byStatus: {} })

      // Task stats
      const { data: tasks } = await this.supabaseAdmin
        .from('service_tasks')
        .select('status, priority')

      const taskStats = tasks.reduce((acc, task) => {
        acc.total++
        acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1
        acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1
        return acc
      }, { total: 0, byStatus: {}, byPriority: {} })

      // File stats
      const { data: files } = await this.supabaseAdmin
        .from('files')
        .select('file_size, is_processed')

      const fileStats = files.reduce((acc, file) => {
        acc.total++
        acc.totalSize += file.file_size || 0
        if (file.is_processed) acc.processed++
        return acc
      }, { total: 0, totalSize: 0, processed: 0 })

      return {
        users: userStats,
        tasks: taskStats,
        files: {
          ...fileStats,
          totalSizeMB: Math.round(fileStats.totalSize / 1024 / 1024 * 100) / 100
        }
      }
    } catch (error) {
      console.error('❌ Error gathering stats:', error.message)
      return null
    }
  }

  async printSystemStats() {
    const stats = await this.getSystemStats()
    if (!stats) return

    console.log('\n📊 SYSTEM STATISTICS')
    console.log('═══════════════════')

    console.log('\n👥 Users:')
    console.log(`  Total: ${stats.users.total}`)
    console.log('  By Role:')
    Object.entries(stats.users.byRole).forEach(([role, count]) => {
      console.log(`    - ${role}: ${count}`)
    })
    console.log('  By Status:')
    Object.entries(stats.users.byStatus).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`)
    })

    console.log('\n📋 Tasks:')
    console.log(`  Total: ${stats.tasks.total}`)
    console.log('  By Status:')
    Object.entries(stats.tasks.byStatus).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`)
    })
    console.log('  By Priority:')
    Object.entries(stats.tasks.byPriority).forEach(([priority, count]) => {
      console.log(`    - ${priority}: ${count}`)
    })

    console.log('\n📁 Files:')
    console.log(`  Total: ${stats.files.total}`)
    console.log(`  Processed: ${stats.files.processed}`)
    console.log(`  Total Size: ${stats.files.totalSizeMB} MB`)
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const adminTools = new AdminTools()

  switch (command) {
    case 'create-user':
      if (args.length < 4) {
        console.log('Usage: node admin-tools.js create-user <email> <password> <fullName> [role]')
        process.exit(1)
      }
      await adminTools.createUser(args[1], args[2], args[3], args[4] || 'technician')
      break

    case 'update-role':
      if (args.length < 3) {
        console.log('Usage: node admin-tools.js update-role <email> <newRole>')
        process.exit(1)
      }
      await adminTools.updateUserRole(args[1], args[2])
      break

    case 'deactivate':
      if (args.length < 2) {
        console.log('Usage: node admin-tools.js deactivate <email>')
        process.exit(1)
      }
      await adminTools.deactivateUser(args[1])
      break

    case 'reactivate':
      if (args.length < 2) {
        console.log('Usage: node admin-tools.js reactivate <email>')
        process.exit(1)
      }
      await adminTools.reactivateUser(args[1])
      break

    case 'reset-password':
      if (args.length < 3) {
        console.log('Usage: node admin-tools.js reset-password <email> <newPassword>')
        process.exit(1)
      }
      await adminTools.resetUserPassword(args[1], args[2])
      break

    case 'stats':
      await adminTools.printSystemStats()
      break

    case 'list-users':
      const { listUsers } = require('./list-users.js')
      await listUsers()
      break

    default:
      console.log('🛠️  Admin Tools - Available Commands:')
      console.log('')
      console.log('User Management:')
      console.log('  create-user <email> <password> <fullName> [role]  - Create a new user')
      console.log('  update-role <email> <newRole>                     - Update user role')
      console.log('  deactivate <email>                                - Deactivate user')
      console.log('  reactivate <email>                                - Reactivate user')
      console.log('  reset-password <email> <newPassword>              - Reset user password')
      console.log('')
      console.log('System Information:')
      console.log('  list-users                                        - List all users')
      console.log('  stats                                             - Show system statistics')
      console.log('')
      console.log('Examples:')
      console.log('  node admin-tools.js create-user tech@company.com Tech123! "John Doe" technician')
      console.log('  node admin-tools.js update-role tech@company.com supervisor')
      console.log('  node admin-tools.js stats')
      break
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = AdminTools