'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignupForm onToggleMode={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  )
}