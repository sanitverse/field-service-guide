'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  User,
  MapPin,
  Download
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

interface TaskReportProps {
  dateRange: DateRange | undefined
}

interface TaskData {
  id: string
  title: string
  status: string
  priority: string
  assigned_to: string
  created_by: string
  due_date: string
  location: string
  created_at: string
  updated_at: string
  assignee?: { full_name: string }
  creator?: { full_name: string }
}

export function TaskReport({ dateRange }: TaskReportProps) {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTaskData()
  }, [dateRange])

  const fetchTaskData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching task data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Report</CardTitle>
          <CardDescription>Loading task data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading report data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate metrics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const overdueTasks = tasks.filter(t => 
    (t.status === 'pending' || t.status === 'in_progress') && 
    new Date(t.due_date) < new Date()
  ).length

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Status distribution
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'Overdue', value: overdueTasks, color: '#ef4444' }
  ].filter(item => item.value > 0)

  // Priority distribution
  const priorityData = [
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#10b981' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#dc2626' }
  ].filter(item => item.value > 0)

  // Tasks by assignee
  const assigneeData = tasks.reduce((acc, task) => {
    const assignee = task.assignee?.full_name || 'Unassigned'
    if (!acc[assignee]) {
      acc[assignee] = { name: assignee, total: 0, completed: 0 }
    }
    acc[assignee].total++
    if (task.status === 'completed') {
      acc[assignee].completed++
    }
    return acc
  }, {} as Record<string, { name: string; total: number; completed: number }>)

  const assigneeChartData = Object.values(assigneeData).map(item => ({
    ...item,
    completionRate: item.total > 0 ? (item.completed / item.total) * 100 : 0
  }))

  // Recent overdue tasks
  const recentOverdueTasks = tasks
    .filter(t => 
      (t.status === 'pending' || t.status === 'in_progress') && 
      new Date(t.due_date) < new Date()
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const exportReport = () => {
    // This would generate a detailed PDF/Excel report
    console.log('Exporting task report...')
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{totalTasks}</div>
                <div className="text-sm text-blue-700">Total Tasks</div>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{completedTasks}</div>
                <div className="text-sm text-green-700">Completed</div>
                <div className="text-xs text-green-600">{completionRate.toFixed(1)}%</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-900">{inProgressTasks}</div>
                <div className="text-sm text-yellow-700">In Progress</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-900">{overdueTasks}</div>
                <div className="text-sm text-red-700">Overdue</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Current status of all tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tasks breakdown by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Performance</span>
            <Button onClick={exportReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardTitle>
          <CardDescription>Task completion rates by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeChartData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'completionRate' ? `${typeof value === 'number' ? value.toFixed(1) : value}%` : value,
                    name === 'completionRate' ? 'Completion Rate' : name
                  ]}
                />
                <Bar dataKey="total" fill="#3b82f6" name="Total Tasks" />
                <Bar dataKey="completed" fill="#10b981" name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Tasks Alert */}
      {recentOverdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Overdue Tasks Requiring Attention
            </CardTitle>
            <CardDescription className="text-red-700">
              {overdueTasks} tasks are past their due dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOverdueTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee?.full_name || 'Unassigned'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </div>
                      {task.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {task.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Task completion progress for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{completionRate.toFixed(1)}% Complete</span>
              <span>{totalTasks - completedTasks} Remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}