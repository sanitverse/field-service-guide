'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Mail
} from 'lucide-react'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { addDays, subDays, format } from 'date-fns'

// Report components
import { TaskReport } from '@/components/reports/task-report'
import { UserProductivityReport } from '@/components/reports/user-productivity-report'
import { FileUsageReport } from '@/components/reports/file-usage-report'
import { SystemHealthReport } from '@/components/reports/system-health-report'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: 'tasks' | 'users' | 'files' | 'system'
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  lastGenerated?: string
}

export default function ReportsPage() {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'task-completion',
      name: 'Task Completion Report',
      description: 'Detailed analysis of task completion rates and performance metrics',
      icon: CheckCircle,
      category: 'tasks',
      frequency: 'weekly',
      lastGenerated: '2024-01-15'
    },
    {
      id: 'overdue-tasks',
      name: 'Overdue Tasks Report',
      description: 'Tasks that are past their due dates with assignment details',
      icon: AlertTriangle,
      category: 'tasks',
      frequency: 'daily',
      lastGenerated: '2024-01-16'
    },
    {
      id: 'user-productivity',
      name: 'User Productivity Report',
      description: 'Individual and team productivity metrics and trends',
      icon: Users,
      category: 'users',
      frequency: 'monthly',
      lastGenerated: '2024-01-01'
    },
    {
      id: 'file-usage',
      name: 'File Usage Analytics',
      description: 'Storage usage, file types, and document access patterns',
      icon: FileText,
      category: 'files',
      frequency: 'monthly',
      lastGenerated: '2024-01-01'
    },
    {
      id: 'system-health',
      name: 'System Health Report',
      description: 'Overall system performance and health indicators',
      icon: BarChart3,
      category: 'system',
      frequency: 'weekly',
      lastGenerated: '2024-01-15'
    },
    {
      id: 'response-time',
      name: 'Response Time Analysis',
      description: 'Task response times and service level metrics',
      icon: Clock,
      category: 'tasks',
      frequency: 'weekly',
      lastGenerated: '2024-01-15'
    }
  ]

  const filteredReports = reportTemplates.filter(report => {
    const categoryMatch = selectedCategory === 'all' || report.category === selectedCategory
    const frequencyMatch = selectedFrequency === 'all' || report.frequency === selectedFrequency
    return categoryMatch && frequencyMatch
  })

  const generateReport = async (reportId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reportId,
          dateRange,
          format: 'pdf' // or 'excel'
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${reportId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const scheduleReport = async (reportId: string, frequency: string, recipients: string[]) => {
    try {
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reportId,
          frequency,
          recipients,
          enabled: true
        })
      })
      
      if (response.ok) {
        // Show success message
        console.log('Report scheduled successfully')
      }
    } catch (error) {
      console.error('Error scheduling report:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tasks': return CheckCircle
      case 'users': return Users
      case 'files': return FileText
      case 'system': return BarChart3
      default: return FileText
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tasks': return 'bg-blue-100 text-blue-800'
      case 'users': return 'bg-green-100 text-green-800'
      case 'files': return 'bg-purple-100 text-purple-800'
      case 'system': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800'
      case 'weekly': return 'bg-yellow-100 text-yellow-800'
      case 'monthly': return 'bg-green-100 text-green-800'
      case 'custom': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate detailed reports and schedule automated deliveries</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Frequency:</label>
              <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const Icon = report.icon
          const CategoryIcon = getCategoryIcon(report.category)
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCategoryColor(report.category)}>
                          {report.category}
                        </Badge>
                        <Badge variant="outline" className={getFrequencyColor(report.frequency)}>
                          {report.frequency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {report.lastGenerated && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      Last generated: {format(new Date(report.lastGenerated), 'MMM dd, yyyy')}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => generateReport(report.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => scheduleReport(report.id, report.frequency, [])}
                      disabled={loading}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Interactive Reports */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Task Reports</TabsTrigger>
          <TabsTrigger value="users">User Reports</TabsTrigger>
          <TabsTrigger value="files">File Reports</TabsTrigger>
          <TabsTrigger value="system">System Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="users">
          {(profile?.role === 'admin' || profile?.role === 'supervisor') ? (
            <UserProductivityReport dateRange={dateRange} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                  <p className="text-gray-600">
                    User reports are only available to administrators and supervisors.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files">
          <FileUsageReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="system">
          <SystemHealthReport dateRange={dateRange} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Quick Export Options
          </CardTitle>
          <CardDescription>
            Export data in various formats for external analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => generateReport('all-tasks')}
            >
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <div className="font-medium">All Tasks</div>
                <div className="text-sm text-gray-600">Complete task export</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => generateReport('user-summary')}
            >
              <Users className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <div className="font-medium">User Summary</div>
                <div className="text-sm text-gray-600">Team performance data</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => generateReport('system-metrics')}
            >
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div className="text-center">
                <div className="font-medium">System Metrics</div>
                <div className="text-sm text-gray-600">Performance indicators</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}