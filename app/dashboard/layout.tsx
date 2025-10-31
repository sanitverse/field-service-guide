'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Home, FileText, Upload, MessageSquare, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/dashboard/tasks', icon: FileText },
    { name: 'Files', href: '/dashboard/files', icon: Upload },
    { name: 'AI Assistant', href: '/dashboard/ai', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ]

  // Add admin/supervisor only navigation
  if (userRole === 'admin' || userRole === 'supervisor') {
    baseNavigation.push({
      name: 'Users',
      href: '/dashboard/users',
      icon: Users,
    })
  }

  return baseNavigation
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  const navigation = getNavigation(profile?.role || 'technician')

  return (
    <ProtectedRoute>
      <NotificationProvider>
        <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">Field Service Guide</span>
              </Link>
            </div>
            
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <nav className="flex items-center space-x-6">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline-block">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              
              <div className="flex items-center space-x-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline-block">
                        {profile?.full_name || profile?.email}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        ({profile?.role})
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-6">
          {children}
        </main>
        </div>
      </NotificationProvider>
    </ProtectedRoute>
  )
}