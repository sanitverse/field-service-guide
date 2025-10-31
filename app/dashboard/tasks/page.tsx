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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track service tasks for your team
          </p>
        </div>
        
        <RoleGuard allowedRoles={['admin', 'supervisor', 'technician']}>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </RoleGuard>
      </div>

      {/* Task Statistics and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <TaskProgress tasks={tasks} userId={user?.id} title="My Progress" />
        </div>
      </div>

      {/* Tasks Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                View and manage all service tasks
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="text-center py-8">
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