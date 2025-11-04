'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={`flex gap-3 justify-start ${className}`}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src="/ai-avatar.png" />
        <AvatarFallback>
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg p-3 max-w-[200px]">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-2">AI is typing</span>
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Message status indicator component
interface MessageStatusProps {
  status: 'sending' | 'sent' | 'error'
  timestamp: Date
  className?: string
}

export function MessageStatus({ status, timestamp, className }: MessageStatusProps) {
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className={`flex items-center gap-2 mt-2 ${className}`}>
      <span className="text-xs opacity-70">
        {formatTimestamp(timestamp)}
      </span>
      {status === 'sending' && (
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
      {status === 'sent' && (
        <div className="flex">
          <div className="w-1 h-1 bg-current rounded-full opacity-70" />
          <div className="w-1 h-1 bg-current rounded-full opacity-70 ml-0.5" />
        </div>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-500">Failed to send</span>
      )}
    </div>
  )
}