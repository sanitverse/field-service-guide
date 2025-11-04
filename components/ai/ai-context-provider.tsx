'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { taskOperations, fileOperations } from '@/lib/database'
import type { ServiceTask, FileRecord } from '@/lib/supabase'

interface AIContextData {
  // User context
  userTasks: ServiceTask[]
  recentFiles: FileRecord[]
  
  // AI suggestions
  taskSuggestions: TaskSuggestion[]
  documentSuggestions: DocumentSuggestion[]
  
  // Context management
  refreshContext: () => Promise<void>
  addTaskSuggestion: (suggestion: TaskSuggestion) => void
  dismissSuggestion: (id: string) => void
}

interface TaskSuggestion {
  id: string
  type: 'create_task' | 'assign_task' | 'update_status' | 'add_comment'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  suggestedData?: Record<string, unknown>
  createdAt: Date
}

interface DocumentSuggestion {
  id: string
  type: 'search_docs' | 'upload_file' | 'review_manual'
  title: string
  description: string
  query?: string
  fileId?: string
  createdAt: Date
}

const AIContext = createContext<AIContextData | null>(null)

export function useAIContext() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAIContext must be used within an AIContextProvider')
  }
  return context
}

interface AIContextProviderProps {
  children: ReactNode
}

export function AIContextProvider({ children }: AIContextProviderProps) {
  const { user, profile } = useAuth()
  const [userTasks, setUserTasks] = useState<ServiceTask[]>([])
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([])
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([])
  const [documentSuggestions, setDocumentSuggestions] = useState<DocumentSuggestion[]>([])

  // Load user context data
  const refreshContext = useCallback(async () => {
    if (!user || !profile) return

    try {
      // Load user's tasks
      const tasks = await taskOperations.getTasks(user.id)
      setUserTasks(tasks)

      // Load recent files
      const files = await fileOperations.getFiles()
      setRecentFiles(files.slice(0, 10)) // Last 10 files

      // Generate AI suggestions based on context
      generateSuggestions(tasks, files, profile.role)

    } catch (error) {
      console.error('Error refreshing AI context:', error)
    }
  }, [user, profile])

  // Generate intelligent suggestions based on user context
  const generateSuggestions = (
    tasks: ServiceTask[], 
    files: FileRecord[], 
    userRole: string
  ) => {
    const newTaskSuggestions: TaskSuggestion[] = []
    const newDocSuggestions: DocumentSuggestion[] = []

    // Task-based suggestions
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && 
      task.status !== 'completed'
    )

    const unassignedTasks = tasks.filter(task => 
      !task.assigned_to && task.status === 'pending'
    )

    const inProgressTasks = tasks.filter(task => 
      task.status === 'in_progress'
    )

    // Suggest updating overdue tasks
    if (overdueTasks.length > 0) {
      newTaskSuggestions.push({
        id: `overdue-${Date.now()}`,
        type: 'update_status',
        title: 'Review Overdue Tasks',
        description: `You have ${overdueTasks.length} overdue task(s). Consider updating their status or extending deadlines.`,
        priority: 'high',
        suggestedData: { taskIds: overdueTasks.map(t => t.id) },
        createdAt: new Date()
      })
    }

    // Suggest assigning unassigned tasks (for supervisors/admins)
    if ((userRole === 'admin' || userRole === 'supervisor') && unassignedTasks.length > 0) {
      newTaskSuggestions.push({
        id: `unassigned-${Date.now()}`,
        type: 'assign_task',
        title: 'Assign Pending Tasks',
        description: `${unassignedTasks.length} task(s) are pending assignment. Consider assigning them to team members.`,
        priority: 'medium',
        suggestedData: { taskIds: unassignedTasks.map(t => t.id) },
        createdAt: new Date()
      })
    }

    // Suggest adding comments to long-running tasks
    const longRunningTasks = inProgressTasks.filter(task => {
      const daysSinceUpdate = (new Date().getTime() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate > 3
    })

    if (longRunningTasks.length > 0) {
      newTaskSuggestions.push({
        id: `stale-${Date.now()}`,
        type: 'add_comment',
        title: 'Update Task Progress',
        description: `${longRunningTasks.length} task(s) haven't been updated in over 3 days. Consider adding progress updates.`,
        priority: 'medium',
        suggestedData: { taskIds: longRunningTasks.map(t => t.id) },
        createdAt: new Date()
      })
    }

    // Document-based suggestions
    const unprocessedFiles = files.filter(file => !file.is_processed)
    
    if (unprocessedFiles.length > 0) {
      newDocSuggestions.push({
        id: `unprocessed-${Date.now()}`,
        type: 'review_manual',
        title: 'Process Uploaded Documents',
        description: `${unprocessedFiles.length} uploaded file(s) are still being processed for search. They'll be available soon.`,
        createdAt: new Date()
      })
    }

    // Suggest relevant document searches based on task types
    const taskTypes = tasks.map(task => task.title.toLowerCase())
    const commonKeywords = ['installation', 'repair', 'maintenance', 'troubleshoot', 'inspect']
    
    commonKeywords.forEach(keyword => {
      if (taskTypes.some(title => title.includes(keyword))) {
        newDocSuggestions.push({
          id: `search-${keyword}-${Date.now()}`,
          type: 'search_docs',
          title: `Search ${keyword} procedures`,
          description: `You have ${keyword} tasks. Search for relevant procedures and manuals.`,
          query: `${keyword} procedure manual guide`,
          createdAt: new Date()
        })
      }
    })

    setTaskSuggestions(newTaskSuggestions.slice(0, 3)) // Limit to 3 suggestions
    setDocumentSuggestions(newDocSuggestions.slice(0, 2)) // Limit to 2 suggestions
  }

  const addTaskSuggestion = (suggestion: TaskSuggestion) => {
    setTaskSuggestions(prev => [suggestion, ...prev.slice(0, 2)])
  }

  const dismissSuggestion = (id: string) => {
    setTaskSuggestions(prev => prev.filter(s => s.id !== id))
    setDocumentSuggestions(prev => prev.filter(s => s.id !== id))
  }

  // Load context on mount and when user changes
  useEffect(() => {
    if (user && profile) {
      refreshContext()
    }
  }, [user, profile])

  // Refresh context periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && profile) {
        refreshContext()
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [user, profile])

  const contextValue: AIContextData = {
    userTasks,
    recentFiles,
    taskSuggestions,
    documentSuggestions,
    refreshContext,
    addTaskSuggestion,
    dismissSuggestion
  }

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  )
}