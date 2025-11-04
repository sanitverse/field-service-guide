'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/ai/chat-interface'
import { ConversationManager } from '@/components/ai/conversation-manager'
import { SuggestionsPanel } from '@/components/ai/suggestions-panel'
import { AIContextProvider } from '@/components/ai/ai-context-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, MessageSquare, Lightbulb } from 'lucide-react'

export default function AIChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined)

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  const handleMessageSent = () => {
    // Refresh conversations when a new message is sent
    // In a real implementation, you might want to update the conversation list
  }

  const handleSuggestionAction = (action: string, data: Record<string, unknown>) => {
    console.log('Suggestion action:', action, data)
    // Handle suggestion actions - could trigger navigation or state updates
  }

  return (
    <AIContextProvider>
      <div className="container mx-auto p-6 h-full">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-muted-foreground">
                Get help with tasks, search documents, and receive intelligent guidance
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Conversations & Suggestions */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs defaultValue="conversations" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Tips
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversations" className="mt-4 h-[calc(100%-3rem)]">
                <ConversationManager
                  selectedConversationId={selectedConversationId}
                  onConversationSelect={handleConversationSelect}
                  className="h-full"
                />
              </TabsContent>
              
              <TabsContent value="suggestions" className="mt-4 h-[calc(100%-3rem)]">
                <SuggestionsPanel
                  className="h-full"
                  onSuggestionAction={handleSuggestionAction}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-4">
            {selectedConversationId ? (
              <ChatInterface
                className="h-full"
                onMessageSent={handleMessageSent}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Assistant</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Select an existing conversation or start a new one to begin chatting with your AI assistant.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground max-w-lg mx-auto">
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">Chat Features:</h4>
                        <p>• Ask questions about your tasks</p>
                        <p>• Search through documents</p>
                        <p>• Get troubleshooting help</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">Smart Suggestions:</h4>
                        <p>• Task management tips</p>
                        <p>• Document recommendations</p>
                        <p>• Workflow optimizations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AIContextProvider>
  )
}