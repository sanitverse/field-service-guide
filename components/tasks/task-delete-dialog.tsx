'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { taskOperations } from '@/lib/database'
import { useNotifications } from '@/lib/notification-context'
import type { ServiceTask } from '@/lib/supabase'

interface TaskDeleteDialogProps {
  task: ServiceTask & {
    assignee?: { id: string; full_name: string | null; email: string }
    creator?: { id: string; full_name: string | null; email: string }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TaskDeleteDialog({ task, open, onOpenChange, onSuccess }: TaskDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { showToast } = useNotifications()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Use the taskOperations.deleteTask function which uses service role
      const success = await taskOperations.deleteTask(task.id)
      
      if (success) {
        showToast(`Task "${task.title}" deleted successfully`, 'success')
        onSuccess?.()
        onOpenChange(false)
      } else {
        showToast('Failed to delete task. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      showToast('Failed to delete task. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-xl text-gray-900">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Delete Task
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Task to be deleted:</h4>
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-800">{task.title}</p>
              {task.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-red-200">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-red-200 text-xs font-medium text-gray-700">
                  Priority: {task.priority}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-red-200 text-xs font-medium text-gray-700">
                  Status: {task.status.replace('_', ' ')}
                </span>
                {task.assignee && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-red-200 text-xs font-medium text-gray-700">
                    Assigned: {task.assignee.full_name || task.assignee.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-gray-800 leading-relaxed">
              <strong className="text-amber-800">Warning:</strong> Deleting this task will permanently remove:
            </p>
            <ul className="mt-2 text-sm text-gray-700 space-y-1 ml-4">
              <li>• The task and all its details</li>
              <li>• All comments and discussions</li>
              <li>• Associated files and attachments</li>
              <li>• Task history and audit trail</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto order-2 sm:order-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white border-0"
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}