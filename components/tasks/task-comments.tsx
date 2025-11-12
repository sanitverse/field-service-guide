'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Send, Edit, Trash2, Paperclip, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { commentOperations } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notification-context'
import { supabase } from '@/lib/supabase'
import type { TaskComment } from '@/lib/supabase'

interface TaskCommentsProps {
  taskId: string
  taskTitle: string
}

type CommentWithAuthor = TaskComment & {
  author: { id: string; full_name: string | null; email: string }
}

export function TaskComments({ taskId, taskTitle }: TaskCommentsProps) {
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadComments()
    
    // Set up real-time subscription for comments
    const subscription = supabase
      .channel(`task_comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('Comment change received:', payload)
          loadComments() // Reload comments when changes occur
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [taskId])

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [comments])

  const loadComments = async () => {
    try {
      const commentsData = await commentOperations.getTaskComments(taskId)
      setComments(commentsData as CommentWithAuthor[])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const comment = await commentOperations.createComment({
        task_id: taskId,
        author_id: user.id,
        content: newComment.trim(),
      })

      if (comment) {
        setNewComment('')
        showToast('Comment added successfully', 'success')
        // The real-time subscription will handle updating the comments list
      }
    } catch (error: any) {
      console.error('Error creating comment:', error)
      
      // Provide specific error messages for different types of errors
      if (error?.code === '42501') {
        showToast('Permission denied: Unable to create comment. Please contact your administrator.', 'error')
        console.error('RLS Policy Error - User may not have proper permissions or profile setup')
      } else if (error?.message?.includes('row-level security')) {
        showToast('Security policy violation: Unable to create comment.', 'error')
      } else {
        showToast('Failed to add comment. Please try again.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const updatedComment = await commentOperations.updateComment(commentId, {
        content: editContent.trim(),
      })

      if (updatedComment) {
        setEditingComment(null)
        setEditContent('')
        showToast('Comment updated successfully', 'success')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      showToast('Failed to update comment', 'error')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const success = await commentOperations.deleteComment(commentId)
      if (success) {
        showToast('Comment deleted successfully', 'success')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      showToast('Failed to delete comment', 'error')
    }
  }

  const startEditing = (comment: CommentWithAuthor) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Comments
          <Badge variant="outline">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Collaborate and discuss about "{taskTitle}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Comments List */}
        <ScrollArea className="h-80" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.full_name, comment.author.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author.full_name || comment.author.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      
                      {user?.id === comment.author_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(comment)}>
                              <Edit className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px]"
                          placeholder="Edit your comment..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm bg-muted/50 rounded-md p-3">
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* New Comment Form */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.user_metadata?.full_name, user.email || '') : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Coming Soon
                    </Badge>
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Ctrl+Enter to send
                  </span>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}