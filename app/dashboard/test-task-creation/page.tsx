'use client'

import { useState } from 'react'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthDebug } from '@/components/debug/auth-debug'
import { useAuth } from '@/lib/auth-context'
import { Plus } from 'lucide-react'

export default function TestTaskCreationPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { user, profile, loading } = useAuth()

  const handleCreateTask = () => {
    console.log('Test create task clicked!')
    setShowTaskForm(true)
  }

  const handleTaskFormSuccess = () => {
    console.log('Task created successfully!')
    setShowTaskForm(false)
    alert('Task created successfully!')
  }

  // Show login prompt if not authenticated
  if (!loading && !user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to test task creation functionality
          </p>
          <Button asChild>
            <a href="/auth">Go to Login</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Task Creation</h1>
          <p className="text-muted-foreground">
            This page tests the task creation functionality directly
          </p>
        </div>
      </div>

      <AuthDebug />

      <Card>
        <CardHeader>
          <CardTitle>Task Creation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">User Info:</h3>
              <ul className="text-sm space-y-1">
                <li>User ID: {user?.id || 'Not logged in'}</li>
                <li>Email: {user?.email || 'N/A'}</li>
                <li>Role: {profile?.role || 'N/A'}</li>
                <li>Status: {profile?.status || 'N/A'}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Test Actions:</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleCreateTask}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Test Create Task
                </Button>
                
                <Button 
                  onClick={() => setShowTaskForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  Force Open Form
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <ul className="text-sm space-y-1">
              <li>Form Open: {showTaskForm ? 'Yes' : 'No'}</li>
              <li>Environment: {process.env.NODE_ENV}</li>
              <li>Timestamp: {new Date().toLocaleTimeString()}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Task Form */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        onSuccess={handleTaskFormSuccess}
      />
    </div>
  )
}