'use client'

import { useState, useEffect } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGuard } from '@/components/auth/role-guard'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskList } from '@/components/tasks/task-list'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDetail } from '@/components/tasks/task-detail'
import { TaskProgress } from '@/components/tasks/task-progress'
import { taskOperations } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import type { ServiceTask } from '@/lib/supabase'

type TaskWithRelations = ServiceTask & {
  assignee?: { id: string; full_name: string | null; email: string }
  creator?: { id: string; full_name: string | null; email: string }
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<ServiceTask | undefined>(undefined)
  const [viewingTask, setViewingTask] = useState<TaskWithRelations | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const tasksData = await taskOperations.getTasks()
      setTasks(tasksData as TaskWithRelations[])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setShowTaskForm(true)
  }

  const handleEditTask = (task: ServiceTask) => {
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
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Service Tasks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track service tasks for your team
          </p>
        </div>
        
        <RoleGuard allowedRoles={['admin', 'supervisor', 'technician']}>
          <Button 
            onClick={handleCreateTask}
            className="w-full sm:w-auto touch-manipulation h-12 sm:h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </RoleGuard>
      </div>

      {/* Task Statistics and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="touch-manipulation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>
            
            <Card className="touch-manipulation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="touch-manipulation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="touch-manipulation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="col-span-1">
          <TaskProgress tasks={tasks} userId={user?.id} title="My Progress" />
        </div>
      </div>

      {/* Tasks Content */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Tasks</CardTitle>
              <CardDescription className="text-sm">
                View and manage all service tasks
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="touch-manipulation h-10 w-10 p-0 sm:h-8 sm:w-auto sm:px-3"
              >
                <List className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">List</span>
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="touch-manipulation h-10 w-10 p-0 sm:h-8 sm:w-auto sm:px-3"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Grid</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading tasks...</div>
            </div>
          ) : (
            <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'list' | 'grid')}>
              <TabsContent value="list" className="mt-0">
                <TaskList
                  tasks={tasks}
                  onEdit={handleEditTask}
                  onView={handleViewTask}
                  onRefresh={loadTasks}
                  currentUserId={user?.id}
                />
              </TabsContent>
              
              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onView={handleViewTask}
                      onRefresh={loadTasks}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
                
                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No tasks found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

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