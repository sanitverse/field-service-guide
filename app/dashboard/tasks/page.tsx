'use client'

import { useState, useEffect } from 'react'

import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { RoleBasedTaskList } from '@/components/tasks/role-based-task-list'
import { taskOperations } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import { useRolePermissions } from '@/lib/hooks/use-role-permissions'

import type { ServiceTask } from '@/lib/supabase'

type TaskWithRelations = ServiceTask & {
  assignee?: { id: string; full_name: string | null; email: string }
  creator?: { id: string; full_name: string | null; email: string }
}

export default function TasksPage() {
  const { user, profile } = useAuth()
  const permissions = useRolePermissions()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<ServiceTask | undefined>(undefined)
  const [viewingTask, setViewingTask] = useState<TaskWithRelations | null>(null)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const tasksData = await taskOperations.getTasks()
      
      // Filter tasks based on role permissions
      let filteredTasks = tasksData as TaskWithRelations[]
      
      // Technicians should only see assigned tasks
      if (permissions.isTechnician && user?.id) {
        filteredTasks = filteredTasks.filter(task => task.assigned_to === user.id)
      }
      
      setTasks(filteredTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = () => {
    // Only allow supervisors and admins to create tasks
    if (!permissions.canCreateTasks) {
      console.warn('User does not have permission to create tasks')
      return
    }
    
    setEditingTask(undefined)
    setShowTaskForm(true)
  }

  const handleEditTask = (task: ServiceTask) => {
    // Check if user can edit this specific task
    if (!permissions.canEditAllTasks && !(permissions.isTechnician && task.assigned_to === user?.id)) {
      console.warn('User does not have permission to edit this task')
      return
    }
    
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleViewTask = (task: ServiceTask) => {
    const taskWithRelations = tasks.find(t => t.id === task.id)
    if (taskWithRelations) {
      setViewingTask(taskWithRelations)
    }
  }

  const handleTaskFormSuccess = () => {
    loadTasks()
    setShowTaskForm(false)
    setEditingTask(undefined)
  }

  const handleBackFromDetail = () => {
    setViewingTask(null)
  }

  // Show task detail view
  if (viewingTask) {
    return (
      <div className="container mx-auto py-6">
        <TaskDetail
          task={viewingTask}
          onEdit={handleEditTask}
          onBack={handleBackFromDetail}
          onRefresh={loadTasks}
          currentUserId={user?.id}
        />
        
        <TaskForm
          open={showTaskForm}
          onOpenChange={setShowTaskForm}
          task={editingTask}
          onSuccess={handleTaskFormSuccess}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6">
      <RoleBasedTaskList
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onViewTask={handleViewTask}
        onRefresh={loadTasks}
        tasks={tasks}
        isLoading={isLoading}
      />

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editingTask}
        onSuccess={handleTaskFormSuccess}
      />
    </div>
  )
}