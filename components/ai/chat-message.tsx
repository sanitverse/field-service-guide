'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageStatus } from './typing-indicator'
import { Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState } from 'react'
import type { ChatMessage } from './chat-interface'

interface ChatMessageProps {
  message: ChatMessage
  userAvatar?: string
  onCopy?: (content: string) => void
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void
}

export function ChatMessageComponent({ 
  message, 
  userAvatar, 
  onCopy, 
  onFeedback 
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    onCopy?.(message.content)
  }

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type)
    onFeedback?.(message.id, type)
  }

  return (
    <div
      className={`flex gap-3 group ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarImage src="/ai-avatar.png" />
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col max-w-[80%]">
        <div
          className={`rounded-lg p-3 ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          
          <MessageStatus
            status={message.status || 'sent'}
            timestamp={message.timestamp}
            className={message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}
          />
        </div>

        {/* Message Actions */}
        {message.role === 'assistant' && (showActions || feedback) && (
          <div className="flex items-center gap-1 mt-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('positive')}
                className={`h-6 px-2 ${
                  feedback === 'positive' 
                    ? 'text-green-600 bg-green-50' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('negative')}
                className={`h-6 px-2 ${
                  feedback === 'negative' 
                    ? 'text-red-600 bg-red-50' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarImage src={userAvatar} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}