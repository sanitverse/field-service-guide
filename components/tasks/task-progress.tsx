'use client'

import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ServiceTask } from '@/lib/supabase'

interface TaskProgressProps {
  tasks: ServiceTask[]
  userId?: string
  title?: string
}

export function TaskProgress({ tasks, userId, title = "Task Progress" }: TaskProgressProps) {
  const stats = useMemo(() => {
    const filteredTasks = userId 
      ? tasks.filter(task => task.assigned_to === userId || task.created_by === userId)
      : tasks

    const total = filteredTasks.length
    const completed = filteredTasks.filter(task => task.status === 'completed').length
    const inProgress = filteredTasks.filter(task => task.status === 'in_progress').length
    const pending = filteredTasks.filter(task => task.status === 'pending').length
    const cancelled = filteredTasks.filter(task => task.status === 'cancelled').length
    const overdue = filteredTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < new Date() && 
      task.status !== 'completed'
    ).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const progressRate = total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      overdue,
      completionRate,
      progressRate
    }
  }, [tasks, userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">
            {stats.completed}/{stats.total} completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{stats.progressRate}%</span>
          </div>
          <Progress value={stats.progressRate} className="h-2" />
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span>{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending:</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              {stats.pending}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Progress:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {stats.inProgress}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.completed}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cancelled:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {stats.cancelled}
            </Badge>
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {stats.overdue > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">
                ⚠️ {stats.overdue} Overdue
              </Badge>
              <span className="text-sm text-red-700">
                {stats.overdue === 1 ? 'task needs' : 'tasks need'} immediate attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}