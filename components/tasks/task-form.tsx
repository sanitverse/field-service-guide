'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, Loader2, Users } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { cn } from '@/lib/utils'
import { taskOperations, profileOperations } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notification-context'
import type { ServiceTask, Profile } from '@/lib/supabase'

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  due_date: z.date().optional(),
  location: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: ServiceTask
  onSuccess?: () => void
}

export function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const { user } = useAuth()
  
  // Safe notification hook usage
  let showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  try {
    const notifications = useNotifications()
    showToast = notifications.showToast
  } catch {
    showToast = (message: string) => {
      console.log(message)
      alert(message)
    }
  }
  
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      assigned_to: task?.assigned_to || 'unassigned',
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      location: task?.location || '',
    },
  })

  // Load users when dialog opens
  React.useEffect(() => {
    if (open && !usersLoaded) {
      loadUsers()
    }
  }, [open, usersLoaded])

  // Reset form when task changes (for editing)
  React.useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || 'unassigned',
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        location: task.location || '',
      })
    } else if (open && !task) {
      // Reset to empty form for creating new task
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'unassigned',
        due_date: undefined,
        location: '',
      })
    }
  }, [open, task, form])

  const loadUsers = async () => {
    try {
      console.log('🔧 Loading technicians directly...')
      const technicians = await profileOperations.getTechnicians()
      console.log('📋 Technicians fetched:', technicians)
      console.log('📋 Technician count:', technicians.length)
      
      // Log each technician
      technicians.forEach((technician, index) => {
        console.log(`👤 Technician ${index + 1}:`, {
          id: technician.id,
          name: technician.full_name,
          email: technician.email,
          role: technician.role,
          status: technician.status
        })
      })
      
      setUsers(technicians)
      setUsersLoaded(true)
    } catch (error) {
      console.error('❌ Error loading technicians:', error)
      setUsersLoaded(true) // Set to true even on error to show the UI
    }
  }

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      showToast('You must be logged in to create a task', 'error')
      return
    }

    setIsLoading(true)
    try {
      const taskData = {
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        assigned_to: values.assigned_to === 'unassigned' ? null : values.assigned_to,
        due_date: values.due_date?.toISOString() || null,
        location: values.location || null,
        created_by: user.id,
        status: 'pending' as const,
      }

      console.log('Submitting task data:', taskData)

      if (task) {
        // Update existing task
        const updatedTask = await taskOperations.updateTask(task.id, taskData)
        if (updatedTask) {
          showToast('Task updated successfully', 'success')
          // Force a small delay to ensure database is updated
          setTimeout(() => {
            onSuccess?.()
          }, 100)
          onOpenChange(false)
          form.reset()
        } else {
          showToast('Failed to update task', 'error')
        }
      } else {
        // Create new task
        const newTask = await taskOperations.createTask(taskData)
        if (newTask) {
          showToast('Task created successfully', 'success')
          if (newTask.assigned_to) {
            showToast('Assignee has been notified', 'info')
          }
          // Force a small delay to ensure database is updated
          setTimeout(() => {
            onSuccess?.()
          }, 100)
          onOpenChange(false)
          form.reset()
        } else {
          showToast('Failed to create task. Please try again.', 'error')
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
      showToast('An error occurred while saving the task', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] p-0 gap-0 overflow-hidden bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            {task 
              ? 'Update the task details below.'
              : 'Fill in the details to create a new service task.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-white">
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 bg-white">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      Task Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Fix HVAC system in Building A" 
                        className="h-11 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the task..."
                        className="resize-none min-h-[100px] bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">
                        Priority <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'medium'}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="low">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Low
                            </span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value="high">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                              High
                            </span>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              Urgent
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">
                        Assign To {usersLoaded && (
                          <span className="text-xs text-gray-500 font-normal">
                            ({users.length} technician{users.length !== 1 ? 's' : ''} available)
                          </span>
                        )}
                        {!usersLoaded && (
                          <span className="text-xs text-orange-500 font-normal">
                            (Loading...)
                          </span>
                        )}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'unassigned'} disabled={!usersLoaded}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <SelectValue placeholder={usersLoaded ? "Select assignee" : "Loading technicians..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="unassigned">
                            <span className="flex items-center gap-2 text-gray-500">
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs">?</span>
                              </span>
                              Unassigned
                            </span>
                          </SelectItem>
                          {users.length > 0 ? (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id} className="text-gray-900">
                                <span className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{user.full_name || user.email}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Active"></span>
                                    </div>
                                  </div>
                                </span>
                              </SelectItem>
                            ))
                          ) : usersLoaded ? (
                            <SelectItem value="no-technicians" disabled>
                              <span className="flex items-center gap-2 text-gray-400">
                                <Users className="w-4 h-4" />
                                No technicians available
                              </span>
                            </SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold text-gray-900 mb-2">
                        Due Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              type="button"
                              className={cn(
                                'h-11 w-full justify-start text-left font-normal',
                                'bg-white text-gray-900 border-gray-300',
                                'hover:bg-gray-50 hover:border-gray-400',
                                'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                !field.value && 'text-gray-500'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: Date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Building A, Floor 3" 
                          className="h-11 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-white gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-11 px-6 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-0"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}