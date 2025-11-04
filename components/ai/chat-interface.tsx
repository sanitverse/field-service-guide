'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { aiOperations } from '@/lib/database'
import { ChatMessageComponent } from './chat-message'
import { TypingIndicator } from './typing-indicator'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

interface ChatInterfaceProps {
  className?: string
  onMessageSent?: (message: ChatMessage) => void
}

export function ChatInterface({ className, onMessageSent }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadConversationHistory()
    }
  }, [user])

  const loadConversationHistory = async () => {
    if (!user) return

    try {
      const interactions = await aiOperations.getUserInteractions(user.id, 20)
      const historyMessages: ChatMessage[] = []

      interactions.reverse().forEach((interaction) => {
        // Add user message
        historyMessages.push({
          id: `${interaction.id}-user`,
          content: interaction.question,
          role: 'user',
          timestamp: new Date(interaction.created_at),
          status: 'sent'
        })

        // Add assistant response
        historyMessages.push({
          id: `${interaction.id}-assistant`,
          content: interaction.response,
          role: 'assistant',
          timestamp: new Date(interaction.created_at),
          status: 'sent'
        })
      })

      setMessages(historyMessages)
    } catch (error) {
      console.error('Error loading conversation history:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      )

      // Show typing indicator
      setIsTyping(true)

      // Call AI API (placeholder for now)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent'
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save interaction to database
      await aiOperations.saveInteraction({
        user_id: user.id,
        question: userMessage.content,
        response: data.response,
        context: data.context || {}
      })

      // Notify parent component
      onMessageSent?.(assistantMessage)

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Update user message status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' }
            : msg
        )
      )

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm mt-2">
                  Ask questions about your tasks, documents, or get help with field service operations.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                userAvatar={user?.user_metadata?.avatar_url}
                onCopy={(content) => {
                  // Show toast notification for copy
                  console.log('Copied to clipboard:', content)
                }}
                onFeedback={(messageId, feedback) => {
                  // Handle feedback - could save to analytics
                  console.log('Message feedback:', messageId, feedback)
                }}
              />
            ))}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}