'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { 
  Link, 
  Unlink, 
  Search, 
  FileText, 
  CheckSquare,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileRecord, ServiceTask } from '@/lib/supabase'

interface FileTaskAssociationProps {
  files: FileRecord[]
  onAssociationChange?: (fileId: string, taskId: string | null) => void
  trigger?: React.ReactNode
}

interface TaskOption extends ServiceTask {
  assignee?: { full_name: string | null }
  creator?: { full_name: string | null }
}

export function FileTaskAssociation({
  files,
  onAssociationChange,
  trigger
}: FileTaskAssociationProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available tasks
  useEffect(() => {
    if (isOpen) {
      loadTasks()
    }
  }, [isOpen])

  const loadTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: tasksError } = await supabase
        .from('service_tasks')
        .select(`
          *,
          assignee:profiles!service_tasks_assigned_to_fkey(full_name),
          creator:profiles!service_tasks_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (tasksError) {
        throw tasksError
      }

      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelection = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map(f => f.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const handleAssociate = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one file')
      return
    }

    if (!selectedTask) {
      setError('Please select a task')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const updates = Array.from(selectedFiles).map(fileId => ({
        id: fileId,
        related_task_id: selectedTask
      }))

      const { error: updateError } = await supabase
        .from('files')
        .upsert(updates)

      if (updateError) {
        throw updateError
      }

      // Notify parent component
      if (onAssociationChange) {
        selectedFiles.forEach(fileId => {
          onAssociationChange(fileId, selectedTask)
        })
      }

      // Reset form
      setSelectedFiles(new Set())
      setSelectedTask('')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to associate files')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisassociate = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one file')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const updates = Array.from(selectedFiles).map(fileId => ({
        id: fileId,
        related_task_id: null
      }))

      const { error: updateError } = await supabase
        .from('files')
        .upsert(updates)

      if (updateError) {
        throw updateError
      }

      // Notify parent component
      if (onAssociationChange) {
        selectedFiles.forEach(fileId => {
          onAssociationChange(fileId, null)
        })
      }

      // Reset form
      setSelectedFiles(new Set())
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disassociate files')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Link className="h-4 w-4 mr-2" />
            Associate with Task
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Associate Files with Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* File Selection */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Files ({files.length})
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-auto border rounded-lg p-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={files.length > 0 && selectedFiles.size === files.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
              
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.related_task_id ? 'Already associated' : 'Not associated'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Selection */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Select Task
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading tasks...
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto border rounded-lg p-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No tasks found
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          'p-3 border rounded-lg cursor-pointer transition-colors',
                          selectedTask === task.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedTask(task.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={cn('text-xs', getTaskStatusColor(task.status))}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                                {task.priority}
                              </Badge>
                              {task.assignee?.full_name && (
                                <span className="text-xs text-muted-foreground">
                                  Assigned to: {task.assignee.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.size} file(s) selected
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDisassociate}
              disabled={selectedFiles.size === 0 || isSaving}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Remove Association
            </Button>
            
            <Button
              onClick={handleAssociate}
              disabled={selectedFiles.size === 0 || !selectedTask || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link className="h-4 w-4 mr-2" />
              )}
              Associate Files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simplified version for single file association
interface SingleFileAssociationProps {
  file: FileRecord
  onAssociationChange?: (taskId: string | null) => void
}

export function SingleFileAssociation({
  file,
  onAssociationChange
}: SingleFileAssociationProps) {
  return (
    <FileTaskAssociation
      files={[file]}
      onAssociationChange={(fileId, taskId) => onAssociationChange?.(taskId)}
      trigger={
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          {file.related_task_id ? 'Change Task' : 'Associate'}
        </Button>
      }
    />
  )
}