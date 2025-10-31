'use client'

import { useAuth } from '@/lib/auth-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type UserRole = 'admin' | 'supervisor' | 'technician' | 'customer'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  redirectTo = '/dashboard'
}: RoleGuardProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be signed in to access this content.
        </AlertDescription>
      </Alert>
    )
  }

  if (!allowedRoles.includes(profile.role)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this content. 
            Required roles: {allowedRoles.join(', ')}. 
            Your role: {profile.role}.
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="outline" 
          onClick={() => router.push(redirectTo)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// Hook for checking roles in components
export function useRoleCheck() {
  const { profile } = useAuth()

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(profile.role)
  }

  const isAdmin = (): boolean => hasRole('admin')
  const isSupervisor = (): boolean => hasRole(['admin', 'supervisor'])
  const isTechnician = (): boolean => hasRole(['admin', 'supervisor', 'technician'])
  const isCustomer = (): boolean => hasRole('customer')

  return {
    hasRole,
    isAdmin,
    isSupervisor,
    isTechnician,
    isCustomer,
    currentRole: profile?.role || null
  }
}