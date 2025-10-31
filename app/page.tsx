'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Field Service Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive field service management application with AI-powered assistance, 
            task management, and intelligent document processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Create, assign, and track service tasks with real-time updates and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Tasks
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Upload & RAG</CardTitle>
              <CardDescription>
                Upload documents and use AI-powered search to find relevant information instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Upload Files
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Get intelligent assistance with troubleshooting, task guidance, and information retrieval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Chat with AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Role-based access control with admin, supervisor, technician, and customer roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Monitor performance metrics, task completion rates, and team productivity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Ready</CardTitle>
              <CardDescription>
                Responsive design optimized for field technicians working on mobile devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Mobile View
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 space-x-4">
          <Button size="lg" asChild>
            <Link href="/auth">
              Get Started
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth">
              Sign In
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
