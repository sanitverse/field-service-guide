'use client'

import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { 
  MoreHorizontal, 
  ArrowUpDown,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { taskOperations } from '@/lib/database'
import { useNotifications } from '@/lib/notification-context'
import { useRolePermissions, canUpdateTask } from '@/lib/hooks/use-role-permissions'
import { TaskDeleteDialog } from './task-delete-dialog'
import type { ServiceTask } from '@/lib/supabase'

type TaskWithRelations = ServiceTask & {
  assignee?: { id: string; full_name: string | null; email: string }
  creator?: { id: string; full_name: string | null; email: string }
}

interface TaskListProps {
  tasks: TaskWithRelations[]
  onEdit?: (task: ServiceTask) => void
  onView?: (task: ServiceTask) => void
  onRefresh?: () => void
  currentUserId?: string
}

const priorityConfig = {
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low', order: 1 },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium', order: 2 },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High', order: 3 },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent', order: 4 },
}

const statusConfig = {
  pending: { 
    color: 'bg-gray-100 text-gray-800', 
    label: 'Pending',
    icon: Clock,
    order: 1
  },
  in_progress: { 
    color: 'bg-blue-100 text-blue-800', 
    label: 'In Progress',
    icon: AlertCircle,
    order: 2
  },
  awaiting_review: { 
    color: 'bg-orange-100 text-orange-800', 
    label: 'Awaiting Review',
    icon: Pause,
    order: 3
  },
  completed: { 
    color: 'bg-green-100 text-green-800', 
    label: 'Completed',
    icon: CheckCircle2,
    order: 4
  },
  cancelled: { 
    color: 'bg-red-100 text-red-800', 
    label: 'Cancelled',
    icon: XCircle,
    order: 5
  },
}

export function TaskList({ tasks, onEdit, onView, onRefresh, currentUserId }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [deleteTask, setDeleteTask] = useState<ServiceTask | null>(null)
  const { showToast } = useNotifications()
  const permissions = useRolePermissions()

  const handleStatusUpdate = async (taskId: string, newStatus: ServiceTask['status']) => {
    setIsUpdating(taskId)
    try {
      const updatedTask = await taskOperations.updateTask(taskId, { status: newStatus })
      if (updatedTask) {
        showToast(`Task status updated to ${newStatus.replace('_', ' ')}`, 'success')
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      showToast('Failed to update task status', 'error')
    } finally {
      setIsUpdating(null)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assigned_to) return false
        if (assigneeFilter === 'me' && task.assigned_to !== currentUserId) return false
        if (assigneeFilter !== 'unassigned' && assigneeFilter !== 'me' && task.assigned_to !== assigneeFilter) return false
      }
      return true
    })
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, currentUserId])

  const uniqueAssignees = useMemo(() => {
    const assignees = new Map()
    tasks.forEach(task => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee)
      }
    })
    return Array.from(assignees.values())
  }, [tasks])

  const columns: ColumnDef<TaskWithRelations>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const task = row.original
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
        
        return (
          <div className="space-y-1">
            <div className={cn(
              "font-medium",
              isOverdue && "text-red-600"
            )}>
              {task.title}
            </div>
            {task.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {task.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as ServiceTask['status']
        const config = statusConfig[status]
        const StatusIcon = config.icon
        
        return (
          <Badge className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        )
      },
      sortingFn: (rowA, rowB) => {
        const statusA = statusConfig[rowA.original.status].order
        const statusB = statusConfig[rowB.original.status].order
        return statusA - statusB
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const priority = row.getValue('priority') as ServiceTask['priority']
        const config = priorityConfig[priority]
        
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      },
      sortingFn: (rowA, rowB) => {
        const priorityA = priorityConfig[rowA.original.priority].order
        const priorityB = priorityConfig[rowB.original.priority].order
        return priorityB - priorityA // Higher priority first
      },
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row }) => {
        const task = row.original
        
        if (!task.assignee) {
          return (
            <span className="text-muted-foreground italic">Unassigned</span>
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{task.assignee.full_name || task.assignee.email}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const task = row.original
        
        if (!task.due_date) {
          return (
            <span className="text-muted-foreground italic">No due date</span>
          )
        }
        
        const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed'
        
        return (
          <div className={cn(
            "flex items-center gap-2",
            isOverdue && "text-red-600 font-medium"
          )}>
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                Overdue
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const location = row.getValue('location') as string
        
        if (!location) {
          return (
            <span className="text-muted-foreground italic">No location</span>
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const task = row.original
        const canEdit = canUpdateTask(permissions, task, currentUserId)
        const updating = isUpdating === task.id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => onView?.(task)}>
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(task)}>
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status !== 'in_progress' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                      disabled={updating}
                    >
                      Mark In Progress
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'completed' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(task.id, 'completed')}
                      disabled={updating}
                    >
                      Mark Completed
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'cancelled' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                      disabled={updating}
                    >
                      Cancel Task
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {/* Delete option for admins */}
              {permissions.canDeleteTasks && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteTask(task)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Priority:</label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Assignee:</label>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="me">My Tasks</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {uniqueAssignees.map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.full_name || assignee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTasks}
        searchKey="title"
        searchPlaceholder="Search tasks..."
      />

      {/* Delete confirmation dialog */}
      {deleteTask && (
        <TaskDeleteDialog
          task={deleteTask}
          open={!!deleteTask}
          onOpenChange={(open) => !open && setDeleteTask(null)}
          onSuccess={() => {
            onRefresh?.()
            setDeleteTask(null)
          }}
        />
      )}
    </div>
  )
}