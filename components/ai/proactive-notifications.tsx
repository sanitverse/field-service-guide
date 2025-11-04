'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  FileText,
  CheckCircle,
  X,
  ExternalLink,
  Zap
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAIContext } from './ai-context-provider'
import { useRouter } from 'next/navigation'

interface ProactiveNotification {
  id: string
  type: 'task_overdue' | 'workload_imbalance' | 'maintenance_due' | 'efficiency_tip' | 'document_suggestion'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionLabel?: string
  actionUrl?: string
  data?: Record<string, unknown>
  createdAt: Date
  dismissed?: boolean
}

interface ProactiveNotificationsProps {
  className?: string
  maxNotifications?: number
}

export function ProactiveNotifications({ 
  className, 
  maxNotifications = 5 
}: ProactiveNotificationsProps) {
  const { user, profile } = useAuth()
  const { userTasks, recentFiles } = useAIContext()
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([])

  const router = useRouter()

  // Generate proactive notifications based on current context
  const generateNotifications = useCallback(() => {
    if (!user || !profile) return

    const newNotifications: ProactiveNotification[] = []
    const now = new Date()

    // 1. Overdue tasks notification
    const overdueTasks = userTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed'
    )

    if (overdueTasks.length > 0) {
      newNotifications.push({
        id: `overdue-${Date.now()}`,
        type: 'task_overdue',
        title: 'Overdue Tasks Detected',
        message: `You have ${overdueTasks.length} overdue task(s). Consider updating priorities or extending deadlines.`,
        priority: 'high',
        actionLabel: 'Review Tasks',
        actionUrl: '/dashboard/tasks?filter=overdue',
        data: { taskIds: overdueTasks.map(t => t.id) },
        createdAt: new Date()
      })
    }

    // 2. Workload imbalance (for supervisors/admins)
    if (profile.role === 'admin' || profile.role === 'supervisor') {
      const unassignedTasks = userTasks.filter(task => 
        !task.assigned_to && task.status === 'pending'
      )

      if (unassignedTasks.length >= 3) {
        newNotifications.push({
          id: `unassigned-${Date.now()}`,
          type: 'workload_imbalance',
          title: 'Unassigned Tasks Accumulating',
          message: `${unassignedTasks.length} tasks are pending assignment. Consider distributing workload among team members.`,
          priority: 'medium',
          actionLabel: 'Assign Tasks',
          actionUrl: '/dashboard/tasks?filter=unassigned',
          data: { taskIds: unassignedTasks.map(t => t.id) },
          createdAt: new Date()
        })
      }
    }

    // 3. Maintenance due notifications
    const maintenanceTasks = userTasks.filter(task => 
      task.title.toLowerCase().includes('maintenance') && 
      task.status === 'completed'
    )

    if (maintenanceTasks.length > 0) {
      // Check if it's been a while since last maintenance
      const lastMaintenance = maintenanceTasks
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
      
      const daysSinceLastMaintenance = Math.floor(
        (now.getTime() - new Date(lastMaintenance.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastMaintenance > 30) {
        newNotifications.push({
          id: `maintenance-${Date.now()}`,
          type: 'maintenance_due',
          title: 'Maintenance Schedule Review',
          message: `It's been ${daysSinceLastMaintenance} days since the last maintenance task. Consider scheduling routine maintenance.`,
          priority: 'medium',
          actionLabel: 'Schedule Maintenance',
          actionUrl: '/dashboard/tasks?action=create&type=maintenance',
          createdAt: new Date()
        })
      }
    }

    // 4. Efficiency tips based on task patterns
    const inProgressTasks = userTasks.filter(task => task.status === 'in_progress')
    const longRunningTasks = inProgressTasks.filter(task => {
      const daysSinceUpdate = (now.getTime() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate > 5
    })

    if (longRunningTasks.length > 0) {
      newNotifications.push({
        id: `efficiency-${Date.now()}`,
        type: 'efficiency_tip',
        title: 'Task Progress Update Needed',
        message: `${longRunningTasks.length} task(s) haven't been updated in over 5 days. Regular updates improve team coordination.`,
        priority: 'low',
        actionLabel: 'Update Tasks',
        actionUrl: '/dashboard/tasks?filter=stale',
        data: { taskIds: longRunningTasks.map(t => t.id) },
        createdAt: new Date()
      })
    }

    // 5. Document suggestions based on task types
    const taskKeywords = userTasks.map(task => task.title.toLowerCase())
    const hasRepairTasks = taskKeywords.some(title => 
      title.includes('repair') || title.includes('fix') || title.includes('broken')
    )

    if (hasRepairTasks && recentFiles.length > 0) {
      newNotifications.push({
        id: `document-${Date.now()}`,
        type: 'document_suggestion',
        title: 'Relevant Documentation Available',
        message: 'You have repair tasks and uploaded manuals. Use AI search to find relevant troubleshooting guides.',
        priority: 'low',
        actionLabel: 'Search Documents',
        actionUrl: '/dashboard/search?q=repair troubleshooting guide',
        createdAt: new Date()
      })
    }

    // 6. Performance insights (for admins)
    if (profile.role === 'admin') {
      const completedTasks = userTasks.filter(task => task.status === 'completed')
      const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0

      if (completionRate < 70 && userTasks.length >= 5) {
        newNotifications.push({
          id: `performance-${Date.now()}`,
          type: 'efficiency_tip',
          title: 'Team Performance Insight',
          message: `Current task completion rate is ${Math.round(completionRate)}%. Consider reviewing task assignments and priorities.`,
          priority: 'medium',
          actionLabel: 'View Analytics',
          actionUrl: '/dashboard/analytics',
          createdAt: new Date()
        })
      }
    }

    // Sort by priority and limit
    const sortedNotifications = newNotifications
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, maxNotifications)

    setNotifications(sortedNotifications)
  }, [user, profile, userTasks, recentFiles, maxNotifications])

  // Generate notifications on mount and when context changes
  useEffect(() => {
    if (user && profile && userTasks.length > 0) {
      generateNotifications()
    }
  }, [user, profile, userTasks, recentFiles])

  // Refresh notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && profile) {
        generateNotifications()
      }
    }, 10 * 60 * 1000) // Every 10 minutes

    return () => clearInterval(interval)
  }, [user, profile])

  const handleNotificationAction = (notification: ProactiveNotification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    dismissNotification(notification.id)
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'workload_imbalance':
        return <Users className="h-4 w-4 text-orange-500" />
      case 'maintenance_due':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'efficiency_tip':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'document_suggestion':
        return <FileText className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (notifications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">
            All caught up!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            No proactive recommendations at the moment
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Smart Recommendations
          <Badge variant="secondary" className="ml-auto">
            {notifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {notifications.map((notification) => (
              <Alert key={notification.id} className="relative">
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                    
                    <AlertDescription className="text-sm mb-3">
                      {notification.message}
                    </AlertDescription>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {notification.createdAt.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {notification.actionLabel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationAction(notification)}
                            className="h-7 px-2 text-xs"
                          >
                            {notification.actionLabel}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}