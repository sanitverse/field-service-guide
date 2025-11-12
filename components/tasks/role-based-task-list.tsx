'use client'

import { useState } from 'react'
import { Plus, LayoutGrid, List, Filter, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TaskList } from '@/components/tasks/task-list'
import { TaskCard } from '@/components/tasks/task-card'

import { useAuth } from '@/lib/auth-context'

import type { ServiceTask } from '@/lib/supabase'

type TaskWithRelations = ServiceTask & {
  assignee?: { id: string; full_name: string | null; email: string }
  creator?: { id: string; full_name: string | null; email: string }
}

interface RoleBasedTaskListProps {
  onCreateTask: () => void
  onEditTask: (task: ServiceTask) => void
  onViewTask: (task: ServiceTask) => void
  onRefresh: () => void
  tasks: TaskWithRelations[]
  isLoading: boolean
}

export function RoleBasedTaskList({
  onCreateTask,
  onEditTask,
  onViewTask,
  onRefresh,
  tasks,
  isLoading
}: RoleBasedTaskListProps) {
  const { user, profile } = useAuth()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  
  // Role-based permissions
  const isSupervisor = profile?.role === 'supervisor' || profile?.role === 'admin'
  const isTechnician = profile?.role === 'technician'
  
  // Filter tasks based on role and filters
  const filteredTasks = tasks.filter(task => {
    // Role-based filtering
    if (isTechnician && task.assigned_to !== user?.id) {
      return false // Technicians only see assigned tasks
    }
    
    // Supervisors only see tasks they created
    if (isSupervisor && task.created_by !== user?.id) {
      return false
    }
    
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }
    
    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false
    }
    
    // Assignee filter (only for supervisors)
    if (isSupervisor && assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assigned_to !== null) {
        return false
      }
      if (assigneeFilter !== 'unassigned' && task.assigned_to !== assigneeFilter) {
        return false
      }
    }
    
    return true
  })
  
  // Calculate statistics based on filtered tasks
  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    awaitingReview: filteredTasks.filter(t => t.status === 'awaiting_review').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    overdue: filteredTasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      !['completed', 'cancelled'].includes(t.status)
    ).length
  }
  
  // Get unique assignees for filter (supervisors only)
  const assignees = isSupervisor ? Array.from(
    new Map(
      tasks
        .filter(t => t.assignee)
        .map(t => t.assignee!)
        .map(assignee => [assignee.id, assignee])
    ).values()
  ) : []

  return (
    <div className="space-y-6">
      {/* Header with role-specific content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            {isTechnician ? 'My Tasks' : 'My Created Tasks'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isTechnician 
              ? 'View and update your assigned tasks'
              : 'Manage and track tasks you have created'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Create Task button - Supervisors only */}
          {isSupervisor && (
            <Button 
              onClick={onCreateTask}
              className="w-full sm:w-auto touch-manipulation h-12 sm:h-10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
          
          {/* Refresh button */}
          <Button 
            variant="outline"
            onClick={onRefresh}
            className="w-full sm:w-auto touch-manipulation h-12 sm:h-10"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-orange-600">{stats.awaitingReview}</div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription className="text-sm">
                Filter tasks by status, priority{isSupervisor ? ', and assignee' : ''}
              </CardDescription>
            </div>
            
            {/* Role indicator */}
            <Badge variant={isSupervisor ? 'default' : 'secondary'}>
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      All Statuses
                    </span>
                  </SelectItem>
                  <SelectItem value="pending" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="awaiting_review" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Awaiting Review
                    </span>
                  </SelectItem>
                  <SelectItem value="completed" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Completed
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Cancelled
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      All Priorities
                    </span>
                  </SelectItem>
                  <SelectItem value="low" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent" className="text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Assignee Filter - Supervisors only */}
            {isSupervisor && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Assignee</label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        All Assignees
                      </span>
                    </SelectItem>
                    <SelectItem value="unassigned" className="text-gray-900 hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        Unassigned
                      </span>
                    </SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id} className="text-gray-900 hover:bg-gray-50">
                        <span className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {(assignee.full_name || assignee.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {assignee.full_name || assignee.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* View Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">View</label>
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`flex-1 h-9 ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm border-0' 
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 h-9 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm border-0' 
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Content */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">
                {isTechnician ? 'My Assigned Tasks' : 'My Created Tasks'}
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredTasks.length} of {tasks.length} tasks
                {isTechnician && ' assigned to you'}
              </CardDescription>
            </div>
            
            {/* Quick filters for awaiting review (Supervisors only) */}
            {isSupervisor && stats.awaitingReview > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter('awaiting_review')}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {stats.awaitingReview} Awaiting Review
              </Button>
            )}
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
                  tasks={filteredTasks}
                  onEdit={onEditTask}
                  onView={onViewTask}
                  onRefresh={onRefresh}
                  currentUserId={user?.id}
                />
              </TabsContent>
              
              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onView={onViewTask}
                      onRefresh={onRefresh}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
                
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {isTechnician 
                        ? 'No tasks assigned to you'
                        : 'No tasks match the current filters'
                      }
                    </p>
                    {isTechnician && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Contact your supervisor if you need tasks assigned
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}