'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { 
  Users, 
  TrendingUp, 
  Award, 
  Target,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare
} from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface UserProductivityReportProps {
  dateRange: DateRange | undefined
}

interface UserMetric {
  user_id: string
  full_name: string
  role: string
  tasks_created: number
  tasks_completed: number
  files_uploaded: number
  ai_interactions: number
}

export function UserProductivityReport({ dateRange }: UserProductivityReportProps) {
  const [userMetrics, setUserMetrics] = useState<UserMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [dateRange])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/user-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 30 })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Productivity Report</CardTitle>
          <CardDescription>Loading user productivity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading report data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate productivity metrics
  const productivityData = userMetrics.map(user => {
    const totalActivity = user.tasks_created + user.tasks_completed + user.files_uploaded + user.ai_interactions
    const taskEfficiency = user.tasks_created > 0 ? (user.tasks_completed / user.tasks_created) * 100 : 0
    
    return {
      ...user,
      totalActivity,
      taskEfficiency,
      productivityScore: (totalActivity * 0.4) + (taskEfficiency * 0.6)
    }
  }).sort((a, b) => b.productivityScore - a.productivityScore)

  // Role-based analysis
  const roleMetrics = userMetrics.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = {
        role: user.role,
        count: 0,
        totalTasks: 0,
        totalFiles: 0,
        totalInteractions: 0,
        avgProductivity: 0
      }
    }
    
    acc[user.role].count++
    acc[user.role].totalTasks += user.tasks_created + user.tasks_completed
    acc[user.role].totalFiles += user.files_uploaded
    acc[user.role].totalInteractions += user.ai_interactions
    
    return acc
  }, {} as Record<string, any>)

  const roleChartData = Object.values(roleMetrics).map((role: any) => ({
    ...role,
    avgTasks: role.count > 0 ? Math.round(role.totalTasks / role.count) : 0,
    avgFiles: role.count > 0 ? Math.round(role.totalFiles / role.count) : 0,
    avgInteractions: role.count > 0 ? Math.round(role.totalInteractions / role.count) : 0
  }))

  // Top performers
  const topPerformers = productivityData.slice(0, 5)

  // Team radar chart data
  const teamRadarData = [
    {
      metric: 'Task Creation',
      value: userMetrics.reduce((sum, user) => sum + user.tasks_created, 0),
      fullMark: Math.max(...userMetrics.map(u => u.tasks_created)) * userMetrics.length
    },
    {
      metric: 'Task Completion',
      value: userMetrics.reduce((sum, user) => sum + user.tasks_completed, 0),
      fullMark: Math.max(...userMetrics.map(u => u.tasks_completed)) * userMetrics.length
    },
    {
      metric: 'File Uploads',
      value: userMetrics.reduce((sum, user) => sum + user.files_uploaded, 0),
      fullMark: Math.max(...userMetrics.map(u => u.files_uploaded)) * userMetrics.length
    },
    {
      metric: 'AI Usage',
      value: userMetrics.reduce((sum, user) => sum + user.ai_interactions, 0),
      fullMark: Math.max(...userMetrics.map(u => u.ai_interactions)) * userMetrics.length
    }
  ]

  const getRoleColor = (role: string) => {
    const colors = {
      admin: '#8b5cf6',
      supervisor: '#3b82f6',
      technician: '#10b981',
      customer: '#f59e0b'
    }
    return colors[role as keyof typeof colors] || '#6b7280'
  }

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Highest productivity scores based on activity and efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((user, index) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback 
                        className="text-white font-medium"
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{user.full_name}</div>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${getRoleColor(user.role)}20`,
                        color: getRoleColor(user.role)
                      }}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{user.tasks_created + user.tasks_completed}</div>
                    <div className="text-sm text-gray-600">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user.files_uploaded}</div>
                    <div className="text-sm text-gray-600">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{user.ai_interactions}</div>
                    <div className="text-sm text-gray-600">AI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{user.productivityScore.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-based Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Role</CardTitle>
            <CardDescription>Average activity levels across different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTasks" fill="#3b82f6" name="Avg Tasks" />
                  <Bar dataKey="avgFiles" fill="#10b981" name="Avg Files" />
                  <Bar dataKey="avgInteractions" fill="#8b5cf6" name="Avg AI Usage" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Activity Overview</CardTitle>
            <CardDescription>Overall team performance across key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={teamRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                  <Radar
                    name="Team Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Performance Breakdown</CardTitle>
          <CardDescription>Detailed activity metrics for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productivityData.map((user) => (
              <div key={user.user_id} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback 
                      className="text-white font-medium"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-600">{user.role}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      <span>Tasks</span>
                    </div>
                    <span className="font-medium">{user.tasks_created + user.tasks_completed}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-green-500" />
                      <span>Files</span>
                    </div>
                    <span className="font-medium">{user.files_uploaded}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-purple-500" />
                      <span>AI Usage</span>
                    </div>
                    <span className="font-medium">{user.ai_interactions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-orange-500" />
                      <span>Score</span>
                    </div>
                    <Badge 
                      variant={user.productivityScore > 50 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.productivityScore.toFixed(0)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productivity Insights
          </CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Most Active Role</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {roleChartData.reduce((max, role) => 
                  role.totalTasks > max.totalTasks ? role : max, roleChartData[0]
                )?.role || 'N/A'}
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Highest task completion rate
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Top Performer</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {topPerformers[0]?.full_name || 'N/A'}
              </div>
              <p className="text-sm text-green-700 mt-1">
                Score: {topPerformers[0]?.productivityScore.toFixed(0) || 0}
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">AI Adoption</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {Math.round((userMetrics.filter(u => u.ai_interactions > 0).length / userMetrics.length) * 100)}%
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Users actively using AI
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}