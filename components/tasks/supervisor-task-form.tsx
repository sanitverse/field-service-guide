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
 