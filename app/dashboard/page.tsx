'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, MessageSquare, Users, BarChart3, Clock } from 'lucide-react'
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
      description: 'Create a new service task',
      icon: FileText,
      href: '/dashboard/tasks/new',
      color: 'text-blue-600',
    },
    {
      title: 'Upload Files',
      description: 'Upload documents and files',
      icon: Upload,
      href: '/dashboard/files/upload',
      color: 'text-green-600',
    },
    {
      title: 'AI Assistant',
      description: 'Get help from AI assistant',
      icon: MessageSquare,
      href: '/dashboard/ai',
      color: 'text-purple-600',
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-orange-600',
    },
  ]

  const roleBasedActions = () => {
    if (profile?.role === 'admin' || profile?.role === 'supervisor') {
      return [
        ...quickActions,
        {
          title: 'Manage Users',
          description: 'Manage team members',
          icon: Users,
          href: '/dashboard/users',
          color: 'text-red-600',
        },
      ]
    }
    return quickActions
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getWelcomeMessage()}, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Welcome to your Field Service Guide dashboard. Here&apos;s what you can do today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              +5 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +8 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              -0.3h from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roleBasedActions().map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={action.href}>
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
            <CardDescription>
              Your recent activity and system updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Task &quot;HVAC Installation&quot; assigned to you</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">File &quot;maintenance-manual.pdf&quot; uploaded</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Assistant helped with troubleshooting</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}