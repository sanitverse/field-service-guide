'use client'

import { useState, useEffect } from 'react'
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
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { 
  Activity, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface SystemHealthReportProps {
  dateRange: DateRange | undefined
}

interface HealthMetric {
  name: string
  value: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

export function SystemHealthReport({ dateRange }: SystemHealthReportProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemHealth()
  }, [dateRange])

  const fetchSystemHealth = async () => {
    setLoading(true)
    try {
      // In a real app, this would fetch actual system metrics
      // For now, we'll simulate the data
      const mockMetrics: HealthMetric[] = [
        {
          name: 'System Uptime',
          value: 99.8,
          status: 'excellent',
          trend: 'stable',
          description: 'System availability over the last 30 days'
        },
        {
          name: 'Response Time',
          value: 85,
          status: 'good',
          trend: 'up',
          description: 'Average API response time performance'
        },
        {
          name: 'Database Performance',
          value: 92,
          status: 'excellent',
          trend: 'up',
          description: 'Query execution and connection health'
        },
        {
          name: 'Storage Health',
          value: 78,
          status: 'good',
          trend: 'stable',
          description: 'File storage and processing efficiency'
        },
        {
          name: 'AI Service Health',
          value: 88,
          status: 'good',
          trend: 'up',
          description: 'OpenAI API connectivity and performance'
        },
        {
          name: 'User Experience',
          value: 91,
          status: 'excellent',
          trend: 'up',
          description: 'Overall user satisfaction metrics'
        }
      ]
      
      setHealthMetrics(mockMetrics)
    } catch (error) {
      console.error('Error fetching system health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health Report</CardTitle>
          <CardDescription>Loading system health data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading health metrics...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate overall system health
  const overallHealth = healthMetrics.reduce((sum, metric) => sum + metric.value, 0) / healthMetrics.length

  // Mock performance trends
  const performanceTrends = [
    { time: '00:00', uptime: 99.9, response: 120, cpu: 45, memory: 62 },
    { time: '04:00', uptime: 99.8, response: 115, cpu: 38, memory: 58 },
    { time: '08:00', uptime: 99.9, response: 135, cpu: 65, memory: 72 },
    { time: '12:00', uptime: 99.7, response: 145, cpu: 78, memory: 85 },
    { time: '16:00', uptime: 99.8, response: 140, cpu: 72, memory: 80 },
    { time: '20:00', uptime: 99.9, response: 125, cpu: 55, memory: 68 }
  ]

  // System components status
  const systemComponents = [
    { name: 'Web Server', status: 'healthy', uptime: 99.9, icon: Server },
    { name: 'Database', status: 'healthy', uptime: 99.8, icon: Database },
    { name: 'File Storage', status: 'healthy', uptime: 99.7, icon: HardDrive },
    { name: 'AI Services', status: 'healthy', uptime: 98.5, icon: Cpu },
    { name: 'Authentication', status: 'healthy', uptime: 99.9, icon: Shield },
    { name: 'Network', status: 'healthy', uptime: 99.6, icon: Wifi }
  ]

  // Recent incidents (mock data)
  const recentIncidents = [
    {
      id: 1,
      title: 'Temporary AI Service Slowdown',
      severity: 'minor',
      time: '2 hours ago',
      duration: '15 minutes',
      resolved: true
    },
    {
      id: 2,
      title: 'Database Connection Pool Optimization',
      severity: 'maintenance',
      time: '1 day ago',
      duration: '5 minutes',
      resolved: true
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: 'text-green-600' }
    if (score >= 90) return { grade: 'A', color: 'text-green-600' }
    if (score >= 85) return { grade: 'B+', color: 'text-blue-600' }
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' }
    if (score >= 75) return { grade: 'C+', color: 'text-yellow-600' }
    return { grade: 'C', color: 'text-red-600' }
  }

  const healthGrade = getHealthGrade(overallHealth)

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall System Health
          </CardTitle>
          <CardDescription>Comprehensive system performance evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${healthGrade.color} mb-2`}>
                {healthGrade.grade}
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">
                {overallHealth.toFixed(1)}%
              </div>
              <Badge className={`${overallHealth >= 90 ? 'bg-green-100 text-green-800' : overallHealth >= 80 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'} border-0`}>
                {overallHealth >= 90 ? 'Excellent' : overallHealth >= 80 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {healthMetrics.slice(0, 3).map((metric) => (
              <div key={metric.name} className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold mb-1 ${getStatusColor(metric.status).split(' ')[0]}`}>
                  {metric.value.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">{metric.name}</div>
                <Progress value={metric.value} className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-sm">{metric.name}</span>
                </div>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metric.value.toFixed(1)}%
              </div>
              
              <div className="flex items-center gap-1 mb-3">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : metric.trend === 'down' ? (
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                ) : (
                  <div className="h-4 w-4 bg-gray-400 rounded-full" />
                )}
                <span className="text-sm text-gray-600">
                  {metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
              
              <p className="text-xs text-gray-500">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends (24h)
          </CardTitle>
          <CardDescription>Key system metrics over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Uptime %"
                />
                <Line 
                  type="monotone" 
                  dataKey="response" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Components Status
          </CardTitle>
          <CardDescription>Health status of individual system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemComponents.map((component) => {
              const Icon = component.icon
              return (
                <div key={component.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{component.name}</div>
                      <div className="text-sm text-gray-600">{component.uptime}% uptime</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Healthy
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Incidents & Maintenance
          </CardTitle>
          <CardDescription>System incidents and maintenance activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentIncidents.length > 0 ? (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      incident.severity === 'critical' ? 'bg-red-500' :
                      incident.severity === 'major' ? 'bg-orange-500' :
                      incident.severity === 'minor' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{incident.title}</div>
                      <div className="text-sm text-gray-600">
                        {incident.time} • Duration: {incident.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {incident.severity}
                    </Badge>
                    {incident.resolved && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Incidents</h3>
              <p className="text-gray-600">System has been running smoothly with no reported issues.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Health Recommendations
          </CardTitle>
          <CardDescription>Suggestions to maintain optimal system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">System Performing Well</span>
              </div>
              <p className="text-sm text-green-700">
                All critical systems are operating within normal parameters. Continue current monitoring practices.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Optimization Opportunities</span>
              </div>
              <p className="text-sm text-blue-700">
                Consider implementing caching strategies to further improve response times during peak hours.
              </p>
            </div>

            {overallHealth < 85 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Attention Required</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Some metrics are below optimal levels. Review system resources and consider scaling if needed.
                </p>
              </div>
            )}

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Scheduled Maintenance</span>
              </div>
              <p className="text-sm text-purple-700">
                Next scheduled maintenance window: Sunday 2:00 AM - 4:00 AM EST for routine updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}