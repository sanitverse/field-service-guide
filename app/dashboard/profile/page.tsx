'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, User, Mail, Shield, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/lib/auth-context'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { profile, updateProfile } = useAuth()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      email: profile?.email || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setError(null)
    setSuccess(null)
    
    const updatedProfile = await updateProfile({
      full_name: data.fullName,
      email: data.email,
    })
    
    if (updatedProfile) {
      setSuccess('Profile updated successfully!')
    } else {
      setError('Failed to update profile. Please try again.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'technician':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'customer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact an administrator if needed.
                      </p>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Details
            </CardTitle>
            <CardDescription>
              View your account information and role permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{profile.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Member since:</span>
                <span>
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${
                  profile.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">Status:</span>
                <span className="capitalize">{profile.status}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Role Permissions</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {profile.role === 'admin' && (
                  <>
                    <div>• Full system access</div>
                    <div>• User management</div>
                    <div>• System configuration</div>
                    <div>• All task and file operations</div>
                  </>
                )}
                {profile.role === 'supervisor' && (
                  <>
                    <div>• Team management</div>
                    <div>• Task assignment and oversight</div>
                    <div>• File access for supervised tasks</div>
                    <div>• Analytics and reporting</div>
                  </>
                )}
                {profile.role === 'technician' && (
                  <>
                    <div>• Assigned task management</div>
                    <div>• File upload and access</div>
                    <div>• AI assistant access</div>
                    <div>• Task commenting and updates</div>
                  </>
                )}
                {profile.role === 'customer' && (
                  <>
                    <div>• View assigned tasks</div>
                    <div>• Limited file access</div>
                    <div>• Basic AI assistant access</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}