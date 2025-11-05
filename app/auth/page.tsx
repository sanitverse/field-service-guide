'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { QuickLogin } from '@/components/auth/quick-login'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (mounted && !loading && user) {
      router.push('/dashboard')
    }
  }, [mounted, user, loading, router])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is logged in, don't show the auth form (redirect will happen)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-4xl">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="quick">Quick Demo Login</TabsTrigger>
            <TabsTrigger value="manual">Manual Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="flex justify-center">
            <QuickLogin />
          </TabsContent>
          
          <TabsContent value="manual" className="flex justify-center">
            <div className="w-full max-w-md">
              {isSignUp ? (
                <SignupForm onToggleMode={() => setIsSignUp(false)} />
              ) : (
                <LoginForm onToggleMode={() => setIsSignUp(true)} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}