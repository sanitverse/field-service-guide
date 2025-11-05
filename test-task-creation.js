/**
 * Simple test to check if task creation components are working
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking Task Creation Components...\n')

// Check if all required components exist
const requiredComponents = [
  'components/tasks/task-form.tsx',
  'components/tasks/task-list.tsx',
  'components/tasks/task-card.tsx',
  'components/tasks/task-detail.tsx',
  'components/tasks/task-progress.tsx',
  'components/tasks/task-comments.tsx',
  'components/auth/role-guard.tsx',
  'app/dashboard/tasks/page.tsx'
]

let allComponentsExist = true

requiredComponents.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component}`)
  } else {
    console.log(`❌ ${component} - MISSING`)
    allComponentsExist = false
  }
})

console.log('\n📋 Component Status:', allComponentsExist ? '✅ All components exist' : '❌ Some components missing')

// Check if the tasks page has the create button
const tasksPagePath = 'app/dashboard/tasks/page.tsx'
if (fs.existsSync(tasksPagePath)) {
  const content = fs.readFileSync(tasksPagePath, 'utf8')
  
  const hasCreateButton = content.includes('Create Task')
  const hasRoleGuard = content.includes('RoleGuard')
  const hasTaskForm = content.includes('TaskForm')
  const hasHandleCreateTask = content.includes('handleCreateTask')
  
  console.log('\n🔍 Tasks Page Analysis:')
  console.log(`  Create Button: ${hasCreateButton ? '✅' : '❌'}`)
  console.log(`  Role Guard: ${hasRoleGuard ? '✅' : '❌'}`)
  console.log(`  Task Form: ${hasTaskForm ? '✅' : '❌'}`)
  console.log(`  Create Handler: ${hasHandleCreateTask ? '✅' : '❌'}`)
  
  // Check role guard configuration
  const roleGuardMatch = content.match(/allowedRoles=\{(\[.*?\])\}/)
  if (roleGuardMatch) {
    console.log(`  Allowed Roles: ${roleGuardMatch[1]}`)
  }
}

// Check if navigation includes tasks
const layoutPath = 'app/dashboard/layout.tsx'
if (fs.existsSync(layoutPath)) {
  const content = fs.readFileSync(layoutPath, 'utf8')
  const hasTasksNav = content.includes('/dashboard/tasks')
  console.log(`\n🧭 Navigation: Tasks link ${hasTasksNav ? '✅' : '❌'}`)
}

console.log('\n💡 Troubleshooting Tips:')
console.log('1. Make sure you\'re logged in as admin/supervisor/technician')
console.log('2. Check browser console for JavaScript errors')
console.log('3. Verify the RoleGuard is not hiding the Create Task button')
console.log('4. Ensure all imports are working correctly')

console.log('\n🔗 Admin Login Credentials:')
console.log('  Email: admin.fieldservice@yopmail.com')
console.log('  Password: Admin@12345')
console.log('  Role: admin (should have full access)')