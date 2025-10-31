'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Calendar, 
  MapPin, 
  User, 
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { taskOperations } from '@/lib/database'
import { useNotifications } from '@/lib/notification-context'
import type { ServiceTask } from '@/lib/supabase'

interface TaskCardProps {
  task: ServiceTask & {
    assignee?: { id: string; full_name: string | null; email: string }
    creator?: { id: string; full_name: string | null; email: string }
  }
  onEdit?: (task: ServiceTask) => void
  onView?: (task: ServiceTask) => void
  onRefresh?: () => void
  currentUserId?: string
}

const priorityConfig = {
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
}

const statusConfig = {
  pending: { 
    color: 'bg-gray-100 text-gray-800', 
    label: 'Pending',
    icon: Clock
  },
  in_progress: { 
    color: 'bg-blue-100 text-blue-800', 
    label: 'In Progress',
    icon: AlertCircle
  },
  completed: { 
    color: 'bg-green-100 text-green-800', 
    label: 'Completed',
    icon: CheckCircle2
  },
  cancelled: { 
    color: 'bg-red-100 text-red-800', 
    label: 'Cancelled',
    icon: XCircle
  },
}

export function TaskCard({ task, onEdit, onView, onRefresh, currentUserId }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { showToast } = useNotifications()

  const priorityStyle = priorityConfig[task.priority]
  const statusStyle = statusConfig[task.status]
  const StatusIcon = statusStyle.icon

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const canEdit = currentUserId && (currentUserId === task.created_by || currentUserId === task.assigned_to)

  const handleStatusUpdate = async (newStatus: ServiceTask['status']) => {
    setIsUpdating(true)
    try {
      const updatedTask = await taskOperations.updateTask(task.id, { status: newStatus })
      if (updatedTask) {
        showToast(`Task status updated to ${newStatus.replace('_', ' ')}`, 'success')
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      showToast('Failed to update task status', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isOverdue && "border-red-200 bg-red-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg leading-tight">
              {task.title}
            </CardTitle>
            {task.description && (
              <CardDescription className="line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={isUpdating}
                    >
                      Mark In Progress
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'completed' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={isUpdating}
                    >
                      Mark Completed
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'cancelled' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={isUpdating}
                    >
                      Cancel Task
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={priorityStyle.color}>
            {priorityStyle.label}
          </Badge>
          <Badge className={statusStyle.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusStyle.label}
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-100 text-red-800">
              Overdue
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {task.assignee && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{task.assignee.full_name || task.assignee.email}</span>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{task.location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
          <span>
            Created by {task.creator?.full_name || task.creator?.email || 'Unknown'}
          </span>
          <span>
            {format(new Date(task.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}