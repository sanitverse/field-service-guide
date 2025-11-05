'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wand2, 
  CheckSquare, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  Lightbulb,
  Loader2,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAIContext } from './ai-context-provider'
import { taskOperations, profileOperations } from '@/lib/database'

interface TaskSuggestion {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedDuration: string
  suggestedAssignee?: string
  location?: string
  dueDate?: string
  category: string
  reasoning: string
}

interface TaskAssistantProps {
  className?: string
  onTaskCreated?: (taskId: string) => void
}

export function TaskAssistant({ className, onTaskCreated }: TaskAssistantProps) {
  const { user, profile } = useAuth()
  const { userTasks, addTaskSuggestion } = useAIContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [inputText, setInputText] = useState('')
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<TaskSuggestion | null>(null)
  const [availableUsers, setAvailableUsers] = useState<Array<{ 
    id: string; 
    full_name: string | null; 
    role: string; 
    status: string;
    email: string;
    created_at: string;
    updated_at: string;
  }>>([])

  // Load available users for assignment
  const loadAvailableUsers = async () => {
    try {
      const users = await profileOperations.getAllProfiles()
      setAvailableUsers(users.filter(u => u.status === 'active'))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // Generate AI task suggestions based on input
  const generateTaskSuggestions = async () => {
    if (!inputText.trim() || !user) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/task-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputText,
          userId: user.id,
          userRole: profile?.role,
          existingTasks: userTasks.slice(0, 5), // Send recent tasks for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      
      if (data.suggestions?.length > 0) {
        setSelectedSuggestion(data.suggestions[0])
        await loadAvailableUsers()
      }
    } catch (error) {
      console.error('Error generating task suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Create task from AI suggestion
  const createTaskFromSuggestion = async (suggestion: TaskSuggestion) => {
    if (!user || !suggestion) return

    setIsCreating(true)
    try {
      const taskData = {
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        created_by: user.id,
        assigned_to: suggestion.suggestedAssignee || null,
        due_date: suggestion.dueDate || null,
        location: suggestion.location || null,
      }

      const createdTask = await taskOperations.createTask(taskData)
      
      if (createdTask) {
        onTaskCreated?.(createdTask.id)
        
        // Add success suggestion to context
        addTaskSuggestion({
          id: `created-${Date.now()}`,
          type: 'create_task',
          title: 'Task Created Successfully',
          description: `"${suggestion.title}" has been created and ${suggestion.suggestedAssignee ? 'assigned' : 'is ready for assignment'}.`,
          priority: 'low',
          createdAt: new Date()
        })

        // Reset form
        setInputText('')
        setSuggestions([])
        setSelectedSuggestion(null)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          AI Task Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe what needs to be done
            </label>
            <Textarea
              placeholder="e.g., 'Customer reported heating system not working at 123 Main St' or 'Need to schedule maintenance for all HVAC units'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <Button
            onClick={generateTaskSuggestions}
            disabled={!inputText.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Task Suggestions
              </>
            )}
          </Button>
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">AI Suggestions ({suggestions.length})</span>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedSuggestion === suggestion
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
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
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {suggestion.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {suggestion.estimatedDuration}
                          </span>
                        )}
                        {suggestion.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {suggestion.location}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Suggestion Details */}
        {selectedSuggestion && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Task Details</span>
            </div>
            
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>AI Reasoning:</strong> {selectedSuggestion.reasoning}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select defaultValue={selectedSuggestion.priority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Assign To</label>
                <Select defaultValue={selectedSuggestion.suggestedAssignee || 'unassigned'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSuggestion.dueDate && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Due Date</label>
                  <Input
                    type="datetime-local"
                    defaultValue={selectedSuggestion.dueDate}
                  />
                </div>
              )}

              {selectedSuggestion.location && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input
                    defaultValue={selectedSuggestion.location}
                    placeholder="Task location"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createTaskFromSuggestion(selectedSuggestion)}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setSelectedSuggestion(null)}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {suggestions.length === 0 && !isGenerating && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Quick Actions</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText('Customer reported equipment malfunction')}
                className="justify-start text-xs"
              >
                Equipment Repair
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText('Schedule routine maintenance inspection')}
                className="justify-start text-xs"
              >
                Maintenance Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText('Emergency service call required')}
                className="justify-start text-xs"
              >
                Emergency Response
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}