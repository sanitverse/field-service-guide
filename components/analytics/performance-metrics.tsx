'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts'
import { 
  Target, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Activity,
  Award
} from 'lucide-react'

interface TaskStatistics {
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

interface StorageStatistics {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

interface PerformanceMetricsProps {
  taskStats: TaskStatistics | null
  storageStats: StorageStatistics | null
  userCount: number
}

export function PerformanceMetrics({ taskStats, storageStats, userCount }: PerformanceMetricsProps) {
  if (!taskStats || !storageStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading metrics...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate key performance indicators
  const completionRate = taskStats.total_tasks > 0 
    ? (taskStats.completed_tasks / taskStats.total_tasks) * 100 
    : 0

  const processingRate = storageStats.total_files > 0 
    ? (storageStats.processed_files / storageStats.total_files) * 100 
    : 0

  const overdueRate = taskStats.total_tasks > 0 
    ? (taskStats.overdue_tasks / taskStats.total_tasks) * 100 
    : 0

  const activeTaskRate = taskStats.total_tasks > 0 
    ? ((taskStats.pending_tasks + taskStats.in_progress_tasks) / taskStats.total_tasks) * 100 
    : 0

  // Mock performance trends (in a real app, this would be time-series data)
  const performanceTrends = [
    { period: 'Week 1', completion: 75, efficiency: 82, quality: 88 },
    { period: 'Week 2', completion: 78, efficiency: 85, quality: 90 },
    { period: 'Week 3', completion: 82, efficiency: 88, quality: 87 },
    { period: 'Week 4', completion: completionRate, efficiency: 90, quality: 92 }
  ]

  // Radial chart data for key metrics
  const radialData = [
    {
      name: 'Task Completion',
      value: completionRate,
      fill: '#10b981'
    },
    {
      name: 'File Processing',
      value: processingRate,
      fill: '#3b82f6'
    },
    {
      name: 'System Health',
      value: Math.max(0, 100 - overdueRate * 2), // Simple health calculation
      fill: '#8b5cf6'
    }
  ]

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const overallScore = (completionRate + processingRate + Math.max(0, 100 - overdueRate * 2)) / 3
  const performanceGrade = getPerformanceGrade(overallScore)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Comprehensive system performance evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${performanceGrade.color} mb-2`}>
                {performanceGrade.grade}
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">
                {overallScore.toFixed(1)}%
              </div>
              <Badge className={`${performanceGrade.bg} ${performanceGrade.color} border-0`}>
                {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Task Completion</div>
              <Progress value={completionRate} className="mt-2 h-2" />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {processingRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">File Processing</div>
              <Progress value={processingRate} className="mt-2 h-2" />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.max(0, 100 - overdueRate * 2).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">System Health</div>
              <Progress value={Math.max(0, 100 - overdueRate * 2)} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Key performance indicators over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Completion Rate"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Efficiency"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Quality Score"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {taskStats.completed_tasks}
                </div>
                <div className="text-sm text-green-700">Completed Tasks</div>
                <div className="text-xs text-green-600 mt-1">
                  {completionRate.toFixed(1)}% completion rate
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {activeTaskRate.toFixed(0)}%
                </div>
                <div className="text-sm text-blue-700">Active Tasks</div>
                <div className="text-xs text-blue-600 mt-1">
                  {taskStats.pending_tasks + taskStats.in_progress_tasks} in progress
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {userCount}
                </div>
                <div className="text-sm text-purple-700">Active Users</div>
                <div className="text-xs text-purple-600 mt-1">
                  Team members
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 ${overdueRate > 10 ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gradient-to-br from-yellow-50 to-yellow-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${overdueRate > 10 ? 'text-red-900' : 'text-yellow-900'}`}>
                  {taskStats.overdue_tasks}
                </div>
                <div className={`text-sm ${overdueRate > 10 ? 'text-red-700' : 'text-yellow-700'}`}>
                  Overdue Tasks
                </div>
                <div className={`text-xs mt-1 ${overdueRate > 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {overdueRate.toFixed(1)}% of total
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overdueRate > 10 ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {overdueRate > 10 ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : (
                  <Clock className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Health Indicators
          </CardTitle>
          <CardDescription>
            Real-time system performance and health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-[150px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[radialData[0]]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-lg font-semibold text-gray-900">Task Completion</div>
              <div className="text-2xl font-bold text-green-600">{completionRate.toFixed(1)}%</div>
            </div>

            <div className="text-center">
              <div className="h-[150px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[radialData[1]]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill={radialData[1].fill} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-lg font-semibold text-gray-900">File Processing</div>
              <div className="text-2xl font-bold text-blue-600">{processingRate.toFixed(1)}%</div>
            </div>

            <div className="text-center">
              <div className="h-[150px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[radialData[2]]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill={radialData[2].fill} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-lg font-semibold text-gray-900">System Health</div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(0, 100 - overdueRate * 2).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Health Recommendations */}
          <div className="mt-6 space-y-3">
            {completionRate < 70 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Task completion rate is below target. Consider reviewing task assignments and deadlines.
                </span>
              </div>
            )}

            {processingRate < 80 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  File processing is behind. Check system resources and processing queue.
                </span>
              </div>
            )}

            {overdueRate > 15 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  High number of overdue tasks detected. Immediate attention required.
                </span>
              </div>
            )}

            {completionRate >= 80 && processingRate >= 90 && overdueRate < 10 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  System is performing excellently across all key metrics!
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}