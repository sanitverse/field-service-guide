'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { CheckCircle, Clock, Play, XCircle, AlertTriangle } from 'lucide-react'

interface TaskStatistics {
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

interface TaskStatusChartProps {
  data: TaskStatistics | null
  detailed?: boolean
}

const COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  overdue: '#ef4444'
}

export function TaskStatusChart({ data, detailed = false }: TaskStatusChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Overview</CardTitle>
          <CardDescription>Loading task statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: 'Pending',
      value: data.pending_tasks,
      color: COLORS.pending,
      icon: Clock
    },
    {
      name: 'In Progress',
      value: data.in_progress_tasks,
      color: COLORS.in_progress,
      icon: Play
    },
    {
      name: 'Completed',
      value: data.completed_tasks,
      color: COLORS.completed,
      icon: CheckCircle
    },
    {
      name: 'Overdue',
      value: data.overdue_tasks,
      color: COLORS.overdue,
      icon: AlertTriangle
    }
  ]

  const barData = chartData.map(item => ({
    status: item.name,
    count: item.value,
    fill: item.color
  }))

  const pieData = chartData.filter(item => item.value > 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${payload[0].value}`}</p>
          <p className="text-sm text-gray-600">
            {((payload[0].value / data.total_tasks) * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Task Status Overview
        </CardTitle>
        <CardDescription>
          Current distribution of tasks by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {detailed ? (
          <div className="space-y-6">
            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {chartData.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.name}
                    className="flex items-center space-x-3 p-3 rounded-lg border"
                    style={{ backgroundColor: `${item.color}10` }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </div>
                      <div className="text-sm text-gray-600">{item.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bar Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Tasks']}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status List */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Status Breakdown</h4>
              <div className="space-y-3">
                {chartData.map((item) => {
                  const Icon = item.icon
                  const percentage = data.total_tasks > 0 
                    ? ((item.value / data.total_tasks) * 100).toFixed(1)
                    : '0'
                  
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: item.color }}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          style={{ 
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                            border: `1px solid ${item.color}40`
                          }}
                        >
                          {item.value}
                        </Badge>
                        <span className="text-sm text-gray-500">{percentage}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {data.total_tasks === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks found for the selected period</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}