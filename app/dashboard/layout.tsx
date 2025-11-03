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
import { 
  LogOut, 
  User, 
  Settings, 
  Home, 
  FileText, 
  Upload, 
  MessageSquare, 
  BarChart3, 
  Users,
  Menu,
  X,
  Zap,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { 
      name: 'Overview', 
      href: '/dashboard', 
      icon: Home,
      description: 'Dashboard overview'
    },
    { 
      name: 'Tasks', 
      href: '/dashboard/tasks', 
      icon: FileText,
      description: 'Manage service tasks'
    },
    { 
      name: 'Files', 
      href: '/dashboard/files', 
      icon: Upload,
      description: 'Document management'
    },
    { 
      name: 'Search', 
      href: '/dashboard/search', 
      icon: Search,
      description: 'AI-powered document search'
    },
    { 
      name: 'AI Assistant', 
      href: '/dashboard/ai', 
      icon: MessageSquare,
      description: 'AI-powered help'
    },
    { 
      name: 'Analytics', 
      href: '/dashboard/analytics', 
      icon: BarChart3,
      description: 'Performance insights'
    },
  ]

  // Add admin/supervisor only navigation
  if (userRole === 'admin' || userRole === 'supervisor') {
    baseNavigation.push({
      name: 'Team',
      href: '/dashboard/users',
      icon: Users,
      description: 'User management'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const navigation = getNavigation(profile?.role || 'technician')

  return (
    <ProtectedRoute>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Field Service Guide
                      </h1>
                      <p className="text-xs text-gray-500">Professional Dashboard</p>
                    </div>
                  </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        )} />
                        <span>{item.name}</span>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 animate-pulse" />
                        )}
                      </Link>
                    )
                  })}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-xl"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        3
                      </span>
                    </Button>
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.full_name || profile?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {profile?.role}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-white/20">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {profile?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Preferences
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-xl"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <div className="lg:hidden border-t border-white/20 bg-white/60 backdrop-blur-md">
                  <div className="px-2 py-4 space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                              : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5",
                            isActive ? "text-white" : "text-gray-500"
                          )} />
                          <div>
                            <div>{item.name}</div>
                            <div className={cn(
                              "text-xs",
                              isActive ? "text-blue-100" : "text-gray-400"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/20 bg-white/40 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-600">
                    © 2024 Field Service Guide. All rights reserved.
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <Link href="#" className="hover:text-gray-700 transition-colors">Support</Link>
                  <Link href="#" className="hover:text-gray-700 transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-gray-700 transition-colors">Terms</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </NotificationProvider>
    </ProtectedRoute>
  )
}