import { useAuth } from '@/lib/auth-context'

export interface RolePermissions {
  // Task permissions
  canCreateTasks: boolean
  canEditAllTasks: boolean
  canDeleteTasks: boolean
  canRequestTaskDeletion: boolean
  canAssignTasks: boolean
  canReassignTasks: boolean
  canViewAllTasks: boolean
  canViewAssignedTasks: boolean
  
  // Task status permissions
  canSetTaskCompleted: boolean
  canSetTaskCancelled: boolean
  canSetTaskInProgress: boolean
  canSetTaskAwaitingReview: boolean
  
  // User management permissions
  canManageUsers: boolean
  canViewAllUsers: boolean
  
  // Admin permissions
  canReviewDeletionRequests: boolean
  canApproveTaskDeletion: boolean
  
  // Role information
  role: string | null
  isSupervisor: boolean
  isTechnician: boolean
  isAdmin: boolean
}

export function useRolePermissions(): RolePermissions {
  const { profile } = useAuth()
  
  const role = profile?.role || null
  const isSupervisor = role === 'supervisor'
  const isTechnician = role === 'technician'
  const isAdmin = role === 'admin'
  
  // Supervisors and admins have elevated permissions
  const hasElevatedPermissions = isSupervisor || isAdmin
  
  return {
    // Task permissions
    canCreateTasks: isSupervisor || isAdmin, // Supervisors and Admins can create
    canEditAllTasks: isAdmin, // Only Admins can edit all tasks
    canDeleteTasks: isAdmin, // Only admins can actually delete tasks
    canRequestTaskDeletion: isSupervisor, // Supervisors can request deletion
    canAssignTasks: isSupervisor || isAdmin, // Supervisors and Admins can assign
    canReassignTasks: isSupervisor || isAdmin, // Supervisors and Admins can reassign
    canViewAllTasks: isAdmin, // Only Admins see all tasks (Supervisors see only their created tasks)
    canViewAssignedTasks: true, // All roles can view assigned tasks
    
    // Task status permissions
    canSetTaskCompleted: hasElevatedPermissions, // Only supervisors can mark as completed
    canSetTaskCancelled: hasElevatedPermissions, // Only supervisors can cancel
    canSetTaskInProgress: true, // All roles can set in progress
    canSetTaskAwaitingReview: true, // All roles can submit for review
    
    // User management permissions
    canManageUsers: isAdmin, // Only admins can manage users
    canViewAllUsers: hasElevatedPermissions,
    
    // Admin permissions
    canReviewDeletionRequests: isAdmin,
    canApproveTaskDeletion: isAdmin,
    
    // Role information
    role,
    isSupervisor,
    isTechnician,
    isAdmin
  }
}

// Helper function to check if user can update a specific task
export function canUpdateTask(
  permissions: RolePermissions,
  task: { assigned_to?: string | null; created_by?: string },
  userId?: string
): boolean {
  // Admins can update any task
  if (permissions.isAdmin) {
    return true
  }
  
  // Supervisors can only update tasks they created
  if (permissions.isSupervisor && userId) {
    return task.created_by === userId
  }
  
  // Technicians can only update tasks assigned to them (status only)
  if (permissions.isTechnician && userId) {
    return task.assigned_to === userId
  }
  
  return false
}

// Helper function to check if user can view a specific task
export function canViewTask(
  permissions: RolePermissions,
  task: { assigned_to?: string | null; created_by?: string },
  userId?: string
): boolean {
  // Admins can view any task
  if (permissions.isAdmin) {
    return true
  }
  
  // Supervisors can only view tasks they created
  if (permissions.isSupervisor && userId) {
    return task.created_by === userId
  }
  
  // Technicians can only view tasks assigned to them
  if (permissions.isTechnician && userId) {
    return task.assigned_to === userId
  }
  
  return false
}

// Helper function to get allowed status transitions for a user
export function getAllowedStatusTransitions(
  permissions: RolePermissions,
  currentStatus: string
): string[] {
  const allStatuses = ['pending', 'in_progress', 'awaiting_review', 'completed', 'cancelled']
  
  // Supervisors and admins can set any status
  if (permissions.canEditAllTasks) {
    return allStatuses
  }
  
  // Technicians have limited status transitions
  if (permissions.isTechnician) {
    switch (currentStatus) {
      case 'pending':
        return ['in_progress']
      case 'in_progress':
        return ['awaiting_review']
      case 'awaiting_review':
        return [] // Cannot change from awaiting review
      default:
        return []
    }
  }
  
  return []
}