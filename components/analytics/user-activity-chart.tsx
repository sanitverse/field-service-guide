'use client'

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
  Area,
  AreaChart
} from 'recharts'
import { Users, FileText, Upload, MessageSquare, Award, TrendingUp } from 'lucide-react'

interface UserActivityMetric {
  user_id: string
  full_name: string
  role: string
  tasks_created: number
  tasks_completed: number
  files_uploaded: number
  ai_interactions: number
}

interface UserActivityChartProps {
  data: UserActivityMetric[]
}

const ROLE_COLORS = {
  admin: '#8b5cf6',
  supervisor: '#3b82f6',
  technician: '#10b981',
  customer: '#f59e0b'
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>No user activity data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No user activity found for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const chartData = data.map(user => ({
    name: user.full_name || 'Unknown User',
    shortName: (user.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase(),
    role: user.role,
    tasksCreated: user.tasks_created,
    tasksCompleted: user.tasks_completed,
    filesUploaded: user.files_uploaded,
    aiInteractions: user.ai_interactions,
    totalActivity: user.tasks_created + user.tasks_completed + user.files_uploaded + user.ai_interactions
  })).sort((a, b) => b.totalActivity - a.totalActivity)

  // Top performers
  const topPerformers = chartData.slice(0, 5)

  // Activity summary by role
  const roleActivity = Object.entries(
    data.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = {
          count: 0,
          tasks: 0,
          files: 0,
          interactions: 0
        }
      }
      acc[user.role].count++
      acc[user.role].tasks += user.tasks_created + user.tasks_completed
      acc[user.role].files += user.files_uploaded
      acc[user.role].interactions += user.ai_interactions
      return acc
    }, {} as Record<string, any>)
  ).map(([role, stats]) => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    users: stats.count,
    tasks: stats.tasks,
    files: stats.files,
    interactions: stats.interactions,
    color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || '#6b7280'
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
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
            Most active users in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((user, index) => (
              <div key={user.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-bold text-gray-400 w-6">
                      #{index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback 
                        className="text-white font-medium"
                        style={{ backgroundColor: ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] }}
                      >
                        {user.shortName}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}20`,
                        color: ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]
                      }}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{user.tasksCreated + user.tasksCompleted}</div>
                    <div className="text-gray-500">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-emerald-600">{user.filesUploaded}</div>
                    <div className="text-gray-500">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">{user.aiInteractions}</div>
                    <div className="text-gray-500">AI</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{user.totalActivity}</div>
                    <div className="text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Activity by Role
          </CardTitle>
          <CardDescription>
            Team activity breakdown by user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tasks" fill="#3b82f6" name="Tasks" />
                <Bar dataKey="files" fill="#10b981" name="Files" />
                <Bar dataKey="interactions" fill="#8b5cf6" name="AI Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual User Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Individual Activity Levels
          </CardTitle>
          <CardDescription>
            Activity comparison across all team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="tasksCreated" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  name="Tasks Created"
                />
                <Area 
                  type="monotone" 
                  dataKey="tasksCompleted" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  name="Tasks Completed"
                />
                <Area 
                  type="monotone" 
                  dataKey="filesUploaded" 
                  stackId="1" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  name="Files Uploaded"
                />
                <Area 
                  type="monotone" 
                  dataKey="aiInteractions" 
                  stackId="1" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  name="AI Interactions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleActivity.map((role) => (
          <Card key={role.role}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: role.color }}>
                    {role.users}
                  </div>
                  <div className="text-sm text-gray-600">{role.role}s</div>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <Users className="h-6 w-6" style={{ color: role.color }} />
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-medium">{role.tasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Files:</span>
                  <span className="font-medium">{role.files}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI:</span>
                  <span className="font-medium">{role.interactions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}