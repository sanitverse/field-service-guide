'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Upload, 
  MessageSquare,
  Calendar,
  Download,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Zap
} from 'lucide-react'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { addDays, subDays, format } from 'date-fns'

// Chart components (we'll implement these)
import { TaskStatusChart } from '@/components/analytics/task-status-chart'
import { UserActivityChart } from '@/components/analytics/user-activity-chart'
import { FileUploadChart } from '@/components/analytics/file-upload-chart'
import { PerformanceMetrics } from '@/components/analytics/performance-metrics'
import { StorageMonitor } from '@/components/analytics/storage-monitor'

interface TaskStatistics {
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

interface UserActivityMetric {
  user_id: string
  full_name: string
  role: string
  tasks_created: number
  tasks_completed: number
  files_uploaded: number
  ai_interactions: number
}

interface StorageStatistics {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

export default function AnalyticsPage() {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null)
  const [userMetrics, setUserMetrics] = useState<UserActivityMetric[]>([])
  const [storageStats, setStorageStats] = useState<StorageStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod, profile])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch task statistics
      const taskStatsResponse = await fetch('/api/analytics/task-statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: profile?.role === 'admin' || profile?.role === 'supervisor' ? null : profile?.id 
        })
      })
      if (taskStatsResponse.ok) {
        const taskData = await taskStatsResponse.json()
        setTaskStats(taskData)
      }

      // Fetch user activity metrics (admin/supervisor only)
      if (profile?.role === 'admin' || profile?.role === 'supervisor') {
        const userMetricsResponse = await fetch('/api/analytics/user-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysBack: parseInt(selectedPeriod) })
        })
        if (userMetricsResponse.ok) {
          const userData = await userMetricsResponse.json()
          setUserMetrics(userData)
        }
      }

      // Fetch storage statistics
      const storageResponse = await fetch('/api/analytics/storage-statistics')
      if (storageResponse.ok) {
        const storageData = await storageResponse.json()
        setStorageStats(storageData)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const days = parseInt(period)
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    })
  }

  const exportData = async (type: 'tasks' | 'users' | 'files') => {
    try {
      const response = await fetch(`/api/analytics/export/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dateRange,
          period: selectedPeriod 
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${type}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCompletionRate = () => {
    if (!taskStats) return 0
    const total = taskStats.total_tasks
    return total > 0 ? Math.round((taskStats.completed_tasks / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor performance and track key metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Tasks</CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {taskStats?.total_tasks || 0}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                {getCompletionRate()}% completed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Active Tasks</CardTitle>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {(taskStats?.pending_tasks || 0) + (taskStats?.in_progress_tasks || 0)}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {taskStats?.overdue_tasks ? (
                <Badge variant="destructive" className="text-xs">
                  {taskStats.overdue_tasks} overdue
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-200 text-emerald-800 text-xs">
                  On track
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Files Stored</CardTitle>
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {storageStats?.total_files || 0}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <Badge variant="secondary" className="bg-purple-200 text-purple-800 text-xs">
                {formatBytes(storageStats?.total_size_bytes || 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Team Members</CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {userMetrics.length || 0}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-xs">
                Active users
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TaskStatusChart data={taskStats} />
            <PerformanceMetrics 
              taskStats={taskStats}
              storageStats={storageStats}
              userCount={userMetrics.length}
            />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Task Analytics</h2>
            <Button onClick={() => exportData('tasks')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Tasks
            </Button>
          </div>
          
          <div className="grid gap-6">
            <TaskStatusChart data={taskStats} detailed />
            
            {/* Task Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Priority Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of tasks by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Urgent</span>
                    </div>
                    <Badge variant="destructive">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium">High</span>
                    </div>
                    <Badge className="bg-orange-500">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Medium</span>
                    </div>
                    <Badge className="bg-yellow-500">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Low</span>
                    </div>
                    <Badge className="bg-green-500">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {(profile?.role === 'admin' || profile?.role === 'supervisor') ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Activity</h2>
                <Button onClick={() => exportData('users')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
              </div>
              
              <UserActivityChart data={userMetrics} />
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                  <p className="text-gray-600">
                    User analytics are only available to administrators and supervisors.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">File Analytics</h2>
            <Button onClick={() => exportData('files')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Files
            </Button>
          </div>
          
          <StorageMonitor />
          <FileUploadChart storageStats={storageStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}