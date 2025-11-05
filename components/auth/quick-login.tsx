'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { Loader2, User, Shield, Wrench } from 'lucide-react'

export function QuickLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setIsLoading(true)
    setError(null)
    
    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError.message)
    } else {
      router.push('/dashboard')
    }
    
    setIsLoading(false)
  }

  const quickLoginOptions = [
    {
      role: 'Admin',
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345',
      icon: Shield,
      description: 'Full system access',
      color: 'from-red-500 to-red-600'
    },
    {
      role: 'Supervisor',
      email: 'supervisor@company.com',
      password: 'Super123!',
      icon: User,
      description: 'Team management',
      color: 'from-blue-500 to-blue-600'
    },
    {
      role: 'Technician',
      email: 'tech@company.com',
      password: 'Tech123!',
      icon: Wrench,
      description: 'Task execution',
      color: 'from-green-500 to-green-600'
    }
  ]

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Quick Login - Demo Accounts</CardTitle>
        <CardDescription>
          Choose a demo account to quickly test the application features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLoginOptions.map((option) => {
            const Icon = option.icon
            return (
              <Card key={option.role} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-full flex items-center justify-center mx-auto`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{option.role}</h3>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <Button
                      onClick={() => handleQuickLogin(option.email, option.password, option.role)}
                      disabled={isLoading}
                      className="w-full"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Login as ${option.role}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Or use the regular login form below with your own credentials</p>
        </div>
      </CardContent>
    </Card>
  )
}