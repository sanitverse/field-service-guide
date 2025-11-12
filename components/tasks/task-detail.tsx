'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  ArrowLeft,
  Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { taskOperations } from '@/lib/database'
import { TaskComments } from './task-comments'
import { useRolePermissions, canUpdateTask } from '@/lib/hooks/use-role-permissions'
import type { ServiceTask } from '@/lib/supabase'

interface TaskDetailProps {
  task: ServiceTask & {
    assignee?: { id: string; full_name: string | null; email: string }
    creator?: { id: string; full_name: string | null; email: string }
  }
  onEdit?: (task: ServiceTask) => void
  onBack?: () => void
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
  awaiting_review: { 
    color: 'bg-orange-100 text-orange-800', 
    label: 'Awaiting Review',
    icon: Pause
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

export function TaskDetail({ task, onEdit, onBack, onRefresh, currentUserId }: TaskDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const permissions = useRolePermissions()

  const priorityStyle = priorityConfig[task.priority]
  const statusStyle = statusConfig[task.status]
  const StatusIcon = statusStyle.icon

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const canEdit = canUpdateTask(permissions, task, currentUserId)

  const handleStatusUpdate = async (newStatus: ServiceTask['status']) => {
    setIsUpdating(true)
    try {
      await taskOperations.updateTask(task.id, { status: newStatus })
      onRefresh?.()
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">
              Task #{task.id.slice(0, 8)}
            </p>
          </div>
        </div>
        
        {canEdit && !permissions.isTechnician && (
          <Button onClick={() => onEdit?.(task)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
        )}
        
        {/* Technician actions */}
        {permissions.isTechnician && task.assigned_to === currentUserId && (
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <Button 
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={isUpdating}
              >
                Start Working
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                onClick={() => handleStatusUpdate('completed')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge className={priorityStyle.color}>
                  {priorityStyle.label} Priority
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
            </CardContent>
          </Card>

          {/* Status Management - Supervisors/Admins only */}
          {canEdit && !permissions.isTechnician && (
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
                <CardDescription>
                  Update the task status to track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Select
                    value={task.status}
                    onValueChange={handleStatusUpdate}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[200px] h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="pending" className="text-gray-900 hover:bg-gray-50">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
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
                  {isUpdating && (
                    <span className="text-sm text-muted-foreground">
                      Updating...
                    </span>
                  )}
                </div>
                

              </CardContent>
            </Card>
          )}
          
          {/* Technician Status Info - Read Only */}
          {permissions.isTechnician && task.assigned_to === currentUserId && (
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>
                  Current status of your assigned task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={statusStyle.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusStyle.label}
                  </Badge>
                </div>
                

              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <TaskComments taskId={task.id} taskTitle={task.title} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Assignee
                </div>
                <div className="text-sm text-muted-foreground ml-6">
                  {task.assignee ? (
                    task.assignee.full_name || task.assignee.email
                  ) : (
                    <span className="italic">Unassigned</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </div>
                <div className={cn(
                  "text-sm ml-6",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                )}>
                  {task.due_date ? (
                    format(new Date(task.due_date), 'EEEE, MMMM d, yyyy')
                  ) : (
                    <span className="italic">No due date set</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <div className="text-sm text-muted-foreground ml-6">
                  {task.location || (
                    <span className="italic">No location specified</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Created By */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Created By</div>
                <div className="text-sm text-muted-foreground">
                  {task.creator?.full_name || task.creator?.email || 'Unknown'}
                </div>
              </div>

              <Separator />

              {/* Timestamps */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Created</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(task.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                </div>
              </div>

              {task.updated_at !== task.created_at && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(task.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}