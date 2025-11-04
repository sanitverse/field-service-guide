'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/ai/chat-interface'
import { TaskAssistant } from '@/components/ai/task-assistant'
import { ProactiveNotifications } from '@/components/ai/proactive-notifications'
import { SuggestionsPanel } from '@/components/ai/suggestions-panel'
import { AIContextProvider } from '@/components/ai/ai-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  MessageSquare, 
  Wand2, 
  Lightbulb,
  BarChart3,
  Zap,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState('chat')
  const router = useRouter()

  const handleTaskCreated = (taskId: string) => {
    // Navigate to the created task
    router.push(`/dashboard/tasks/${taskId}`)
  }

  const handleSuggestionAction = (action: string, data: Record<string, unknown>) => {
    console.log('Suggestion action:', action, data)
    // Handle various suggestion actions
  }

  return (
    <AIContextProvider>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Assistant Hub</h1>
                <p className="text-muted-foreground">
                  Intelligent assistance for field service operations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/search')}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Search
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/analytics')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Quick Actions & Notifications */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chat Assistant</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Task Generator</span>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Smart Search</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notifications</span>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Proactive Notifications */}
            <ProactiveNotifications 
              className="h-[400px]"
              maxNotifications={3}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Task AI
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tips
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Insights
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-6">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[600px]">
                  <div className="xl:col-span-4">
                    <ChatInterface 
                      className="h-full"
                      onMessageSent={() => {
                        // Could refresh other components
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Task Assistant Tab */}
              <TabsContent value="tasks" className="mt-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <TaskAssistant 
                      className="h-[600px]"
                      onTaskCreated={handleTaskCreated}
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <Card className="h-[600px]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          Task Creation Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">Be Specific</h4>
                            <p className="text-xs text-muted-foreground">
                              Include location, equipment type, and customer details for better AI suggestions.
                            </p>
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">Use Keywords</h4>
                            <p className="text-xs text-muted-foreground">
                              Words like "urgent", "maintenance", "repair" help AI understand priority and type.
                            </p>
                          </div>
                          
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">Context Matters</h4>
                            <p className="text-xs text-muted-foreground">
                              Mention symptoms, error codes, or customer complaints for accurate task creation.
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm mb-2">Example Inputs:</h4>
                          <div className="space-y-2 text-xs">
                            <div className="p-2 bg-muted rounded">
                              &quot;HVAC unit not cooling at 123 Oak St, customer reports warm air&quot;
                            </div>
                            <div className="p-2 bg-muted rounded">
                              &quot;Schedule quarterly maintenance for all units in Building A&quot;
                            </div>
                            <div className="p-2 bg-muted rounded">
                              &quot;Emergency: Water leak in basement, customer called&quot;
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Suggestions Tab */}
              <TabsContent value="suggestions" className="mt-6">
                <SuggestionsPanel 
                  className="h-[600px]"
                  onSuggestionAction={handleSuggestionAction}
                />
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        AI Usage Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Chat Messages</span>
                          <Badge variant="outline">24 today</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tasks Generated</span>
                          <Badge variant="outline">8 this week</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Document Searches</span>
                          <Badge variant="outline">15 today</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Suggestions Acted On</span>
                          <Badge variant="outline">6 this week</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Performance Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Task Completion Rate</span>
                            <span className="text-green-600">+12%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-[85%]"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Response Time</span>
                            <span className="text-blue-600">-25%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full w-[75%]"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Documentation Usage</span>
                            <span className="text-purple-600">+40%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full w-[90%]"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AIContextProvider>
  )
}