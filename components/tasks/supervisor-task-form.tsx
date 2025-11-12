'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, Loader2, Users, MapPin, AlertTriangle } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { taskOperations, profileOperations } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notification-context'
import { useRolePermissions } from '@/lib/hooks/use-role-permissions'
import type { ServiceTask, Profile } from '@/lib/supabase'

const supervisorTaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().min(1, 'Please assign this task to a technician'),
  due_date: z.date().optional(),
  location: z.string().optional(),
})

type SupervisorTaskFormValues = z.infer<typeof supervisorTaskFormSchema>

interface SupervisorTaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: ServiceTask
  onSuccess?: () => void
}

const priorityConfig = {
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low', icon: '🔵' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium', icon: '🟡' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High', icon: '🟠' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent', icon: '🔴' },
}

export function SupervisorTaskForm({ open, onOpenChange, task, onSuccess }: SupervisorTaskFormProps) {
  const { user } = useAuth()
  const permissions = useRolePermissions()
  
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
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [techniciansLoaded, setTechniciansLoaded] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<Profile | null>(null)

  // Only allow supervisors and admins to use this form
  if (!permissions.canCreateTasks) {
    return null
  }

  const form = useForm<SupervisorTaskFormValues>({
    resolver: zodResolver(supervisorTaskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      assigned_to: task?.assigned_to || '',
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      location: task?.location || '',
    },
  })

  // Load technicians when dialog opens
  useEffect(() => {
    if (open && !techniciansLoaded) {
      loadTechnicians()
    }
  }, [open, techniciansLoaded])

  // Reset form when task changes (for editing)
  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        location: task.location || '',
      })
      
      // Find and set selected technician
      if (task.assigned_to && technicians.length > 0) {
        const tech = technicians.find(t => t.id === task.assigned_to)
        setSelectedTechnician(tech || null)
      }
    } else if (open && !task) {
      // Reset to empty form for creating new task
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: undefined,
        location: '',
      })
      setSelectedTechnician(null)
    }
  }, [open, task, form, technicians])

  const loadTechnicians = async () => {
    try {
      console.log('🔧 Loading technicians for supervisor form...')
      const technicianList = await profileOperations.getTechnicians()
      console.log('📋 Technicians loaded:', technicianList.length)
      
      setTechnicians(technicianList)
      setTechniciansLoaded(true)
    } catch (error) {
      console.error('❌ Error loading technicians:', error)
      showToast('Failed to load technicians', 'error')
      setTechniciansLoaded(true)
    }
  }

  const onSubmit = async (values: SupervisorTaskFormValues) => {
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
        assigned_to: values.assigned_to,
        due_date: values.due_date?.toISOString() || null,
        location: values.location || null,
        created_by: user.id,
        status: 'pending' as const,
      }

      console.log('Submitting supervisor task data:', taskData)

      if (task) {
        // Update existing task
        const updatedTask = await taskOperations.updateTask(task.id, taskData)
        if (updatedTask) {
          showToast('Task updated successfully', 'success')
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
          showToast('Task created and assigned successfully', 'success')
          showToast('Technician has been notified', 'info')
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 gap-0 overflow-hidden bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            {task ? 'Edit Task Assignment' : 'Create & Assign Task'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            {task 
              ? 'Update task details and reassign if needed.'
              : 'Create a new service task and assign it to a technician.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-white">
            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 bg-white">
              {/* Task Title */}
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

              {/* Task Description */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Priority */}
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
                          {Object.entries(priorityConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value} className="text-gray-900 hover:bg-gray-50">
                              <span className="flex items-center gap-2">
                                <span className="text-sm">{config.icon}</span>
                                <Badge className={cn(config.color, "text-xs")}>
                                  {config.label}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Technician Assignment */}
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">
                        Assign To <span className="text-red-500">*</span>
                        {techniciansLoaded && (
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            ({technicians.length} available)
                          </span>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          const tech = technicians.find(t => t.id === value)
                          setSelectedTechnician(tech || null)
                        }} 
                        defaultValue={field.value || ''} 
                        disabled={!techniciansLoaded}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <SelectValue placeholder={techniciansLoaded ? "Select technician" : "Loading technicians..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {technicians.length > 0 ? (
                            technicians.map((technician) => (
                              <SelectItem key={technician.id} value={technician.id} className="text-gray-900 hover:bg-gray-50">
                                <span className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600">
                                      {(technician.full_name || technician.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{technician.full_name || technician.email}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 capitalize">{technician.role}</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Active"></span>
                                    </div>
                                  </div>
                                </span>
                              </SelectItem>
                            ))
                          ) : techniciansLoaded ? (
                            <SelectItem value="no-technicians" disabled className="text-gray-400">
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Due Date */}
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

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">
                        Location
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="e.g., Building A, Floor 3" 
                            className="h-11 pl-10 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Selected Technician Preview */}
              {selectedTechnician && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {(selectedTechnician.full_name || selectedTechnician.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Task will be assigned to: {selectedTechnician.full_name || selectedTechnician.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Role: {selectedTechnician.role} • Status: {selectedTechnician.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <DialogFooter className="px-6 py-4 bg-white gap-3">
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
                disabled={isLoading || !techniciansLoaded}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-0"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Update & Assign Task' : 'Create & Assign Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}