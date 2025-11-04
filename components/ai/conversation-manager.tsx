'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock,
  Search,
  FileText,
  Wrench
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { aiOperations } from '@/lib/database'
import type { AIInteraction } from '@/lib/supabase'

interface ConversationSummary {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
  category: 'general' | 'search' | 'tasks' | 'troubleshooting'
}

interface ConversationManagerProps {
  onConversationSelect?: (conversationId: string) => void
  selectedConversationId?: string
  className?: string
}

export function ConversationManager({ 
  onConversationSelect, 
  selectedConversationId,
  className 
}: ConversationManagerProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const interactions = await aiOperations.getUserInteractions(user.id, 100)
      
      // Group interactions into conversations (simplified - in real app you'd have conversation IDs)
      const conversationMap = new Map<string, AIInteraction[]>()
      
      interactions.forEach(interaction => {
        // For now, group by date (each day is a conversation)
        const dateKey = new Date(interaction.created_at).toDateString()
        if (!conversationMap.has(dateKey)) {
          conversationMap.set(dateKey, [])
        }
        conversationMap.get(dateKey)!.push(interaction)
      })

      const conversationSummaries: ConversationSummary[] = Array.from(conversationMap.entries())
        .map(([dateKey, interactions]) => {
          const lastInteraction = interactions[0] // Most recent
          const category = categorizeConversation(interactions)
          
          return {
            id: dateKey,
            title: generateConversationTitle(interactions),
            lastMessage: lastInteraction.response.substring(0, 100) + '...',
            timestamp: new Date(lastInteraction.created_at),
            messageCount: interactions.length * 2, // Each interaction has question + response
            category
          }
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      setConversations(conversationSummaries)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const categorizeConversation = (interactions: AIInteraction[]): ConversationSummary['category'] => {
    const allText = interactions.map(i => i.question + ' ' + i.response).join(' ').toLowerCase()
    
    if (allText.includes('search') || allText.includes('find') || allText.includes('document')) {
      return 'search'
    }
    if (allText.includes('task') || allText.includes('assign') || allText.includes('complete')) {
      return 'tasks'
    }
    if (allText.includes('problem') || allText.includes('error') || allText.includes('troubleshoot')) {
      return 'troubleshooting'
    }
    
    return 'general'
  }

  const generateConversationTitle = (interactions: AIInteraction[]): string => {
    const firstQuestion = interactions[interactions.length - 1]?.question || ''
    
    // Extract key topics from the first question
    const words = firstQuestion.split(' ').slice(0, 6)
    let title = words.join(' ')
    
    if (title.length > 40) {
      title = title.substring(0, 37) + '...'
    }
    
    return title || 'New Conversation'
  }

  const getCategoryIcon = (category: ConversationSummary['category']) => {
    switch (category) {
      case 'search':
        return <Search className="h-4 w-4" />
      case 'tasks':
        return <FileText className="h-4 w-4" />
      case 'troubleshooting':
        return <Wrench className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: ConversationSummary['category']) => {
    switch (category) {
      case 'search':
        return 'bg-blue-100 text-blue-800'
      case 'tasks':
        return 'bg-green-100 text-green-800'
      case 'troubleshooting':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 168) { // Less than a week
      return timestamp.toLocaleDateString([], { 
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return timestamp.toLocaleDateString([], { 
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handleNewConversation = () => {
    // In a real implementation, you'd create a new conversation ID
    onConversationSelect?.('new')
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // In a real implementation, you'd delete the conversation
    // For now, just remove from local state
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button
            onClick={handleNewConversation}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">
                  Start chatting with your AI assistant
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedConversationId === conversation.id 
                      ? 'bg-muted border-primary' 
                      : 'bg-background'
                  }`}
                  onClick={() => onConversationSelect?.(conversation.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(conversation.category)}`}
                        >
                          {getCategoryIcon(conversation.category)}
                          <span className="ml-1 capitalize">{conversation.category}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {conversation.messageCount} messages
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-sm truncate mb-1">
                        {conversation.title}
                      </h4>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(conversation.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}