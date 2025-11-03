'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Zap,
  ArrowRight,
  Activity,
  Target,
  Award
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const quickActions = [
    {
      title: 'Create Task',
      description: 'Start a new service task',
      icon: FileText,
      href: '/dashboard/tasks',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Upload Files',
      description: 'Add documents and files',
      icon: Upload,
      href: '/dashboard/files',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
    },
    {
      title: 'AI Assistant',
      description: 'Get intelligent help',
      icon: MessageSquare,
      href: '/dashboard/ai',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
    {
      title: 'View Analytics',
      description: 'Performance insights',
      icon: BarChart3,
      href: '/dashboard/analytics',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
    },
  ]

  const roleBasedActions = () => {
    if (profile?.role === 'admin' || profile?.role === 'supervisor') {
      return [
        ...quickActions,
        {
          title: 'Manage Team',
          description: 'User management',
          icon: Users,
          href: '/dashboard/users',
          gradient: 'from-pink-500 to-pink-600',
          bgGradient: 'from-pink-50 to-pink-100',
        },
      ]
    }
    return quickActions
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {getWelcomeMessage()}, {profile?.full_name || 'User'}!
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to manage your field operations efficiently
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{profile?.role} Dashboard</span>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Tasks</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">12</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">
                +2 from yesterday
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Files Uploaded</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">48</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">
                +5 from yesterday
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">AI Interactions</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">23</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">
                +8 from yesterday
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Response Time</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">2.4h</div>
            <div className="flex items-center space-x-1 mt-2">
              <Target className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-blue-600 font-medium">
                -0.3h improvement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600">Get started with common tasks</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roleBasedActions().map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.title} className="group border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${action.gradient}`}></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.bgGradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className={`w-full bg-gradient-to-r ${action.gradient} hover:shadow-lg transition-all duration-300`}>
                    <Link href={action.href}>
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Task "HVAC Installation" assigned to you</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago • High Priority</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">File "maintenance-manual.pdf" uploaded</p>
                  <p className="text-xs text-gray-500 mt-1">4 hours ago • 2.4 MB</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">AI Assistant helped with troubleshooting</p>
                  <p className="text-xs text-gray-500 mt-1">6 hours ago • Electrical Issue</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/activity">
                View All Activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Pending Tasks</CardTitle>
                <CardDescription>Tasks requiring your attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Equipment Repair</p>
                    <p className="text-xs text-red-600">Due today</p>
                  </div>
                </div>
                <Button size="sm" className="bg-red-500 hover:bg-red-600">
                  View
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Safety Inspection</p>
                    <p className="text-xs text-yellow-600">Due tomorrow</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Client Meeting</p>
                    <p className="text-xs text-blue-600">Due in 3 days</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/tasks">
                View All Tasks
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}