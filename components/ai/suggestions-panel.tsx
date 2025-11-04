'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Lightbulb, 
  FileText, 
  CheckSquare, 
  UserPlus, 
  MessageSquare, 
  Search,
  Upload,
  BookOpen,
  X,
  ChevronRight,
  Clock
} from 'lucide-react'
import { useAIContext } from './ai-context-provider'
import { useRouter } from 'next/navigation'

interface SuggestionsPanelProps {
  className?: string
  onSuggestionAction?: (action: string, data: Record<string, unknown>) => void
}

export function SuggestionsPanel({ className, onSuggestionAction }: SuggestionsPanelProps) {
  const { taskSuggestions, documentSuggestions, dismissSuggestion } = useAIContext()

  const router = useRouter()

  const getTaskSuggestionIcon = (type: string) => {
    switch (type) {
      case 'create_task':
        return <CheckSquare className="h-4 w-4" />
      case 'assign_task':
        return <UserPlus className="h-4 w-4" />
      case 'update_status':
        return <Clock className="h-4 w-4" />
      case 'add_comment':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getDocumentSuggestionIcon = (type: string) => {
    switch (type) {
      case 'search_docs':
        return <Search className="h-4 w-4" />
      case 'upload_file':
        return <Upload className="h-4 w-4" />
      case 'review_manual':
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleTaskSuggestionAction = (suggestion: { type: string; suggestedData?: Record<string, unknown>; id: string }) => {
    switch (suggestion.type) {
      case 'create_task':
        router.push('/dashboard/tasks?action=create')
        break
      case 'assign_task':
        router.push('/dashboard/tasks?filter=unassigned')
        break
      case 'update_status':
        router.push('/dashboard/tasks?filter=overdue')
        break
      case 'add_comment':
        router.push('/dashboard/tasks?filter=stale')
        break
    }
    
    onSuggestionAction?.(suggestion.type, suggestion.suggestedData || {})
    dismissSuggestion(suggestion.id)
  }

  const handleDocumentSuggestionAction = (suggestion: { type: string; query?: string; id: string }) => {
    switch (suggestion.type) {
      case 'search_docs':
        router.push(`/dashboard/search?q=${encodeURIComponent(suggestion.query || '')}`)
        break
      case 'upload_file':
        router.push('/dashboard/files?action=upload')
        break
      case 'review_manual':
        router.push('/dashboard/files?filter=unprocessed')
        break
    }
    
    onSuggestionAction?.(suggestion.type, suggestion)
    dismissSuggestion(suggestion.id)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const allSuggestions = [...taskSuggestions, ...documentSuggestions]

  if (allSuggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No suggestions at the moment
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            AI suggestions will appear here based on your activity
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Suggestions
          <Badge variant="secondary" className="ml-auto">
            {allSuggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {/* Task Suggestions */}
            {taskSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Task Management</span>
                </div>
                
                {taskSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          {getTaskSuggestionIcon(suggestion.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(suggestion.createdAt)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTaskSuggestionAction(suggestion)}
                                className="h-7 px-2 text-xs"
                              >
                                Take Action
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Separator if both types exist */}
            {taskSuggestions.length > 0 && documentSuggestions.length > 0 && (
              <Separator className="my-4" />
            )}

            {/* Document Suggestions */}
            {documentSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Documents & Search</span>
                </div>
                
                {documentSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-1.5 bg-green-100 rounded-md">
                          {getDocumentSuggestionIcon(suggestion.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          
                          {suggestion.query && (
                            <div className="bg-muted rounded px-2 py-1 mb-2">
                              <span className="text-xs text-muted-foreground">Suggested search: </span>
                              <span className="text-xs font-mono">{suggestion.query}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(suggestion.createdAt)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentSuggestionAction(suggestion)}
                                className="h-7 px-2 text-xs"
                              >
                                {suggestion.type === 'search_docs' ? 'Search' : 'View'}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}