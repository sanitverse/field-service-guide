import { NextRequest, NextResponse } from 'next/server'

import { openai } from '@/lib/openai'
import { searchDocumentChunks } from '@/lib/document-processing'
import { taskOperations, profileOperations } from '@/lib/database'

export async function POST(request: NextRequest) {
  let message = ''
  let userId = ''
  let profile: any = null
  let taskContext = ''
  let ragContext = ''
  let searchResults: Array<{ file?: { filename: string }; content: string; similarity: number }> = []
  let messages: any[] = []
  let shouldSearch = false
  
  try {
    // For now, we'll skip auth check in the API route
    // In production, you'd want to implement proper auth validation

    const requestData = await request.json()
    message = requestData.message
    userId = requestData.userId
    const { conversationHistory } = requestData

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user profile for context
    profile = await profileOperations.getProfile(userId)
    if (!profile) {
      // Create a fallback profile for the API to work
      profile = profileOperations.createMockProfile(userId, 'user@example.com', 'Test User', 'technician')
    }

    // Perform RAG search if the message seems to be asking for information
    const searchKeywords = ['find', 'search', 'what', 'how', 'when', 'where', 'document', 'file', 'procedure', 'manual', 'guide', 'instruction']
    shouldSearch = searchKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )

    if (shouldSearch) {
      try {
        searchResults = await searchDocumentChunks(message, {
          matchThreshold: 0.75,
          matchCount: 5
        })

        if (searchResults.length > 0) {
          ragContext = `\n\nRelevant document excerpts:\n${
            searchResults.map((result, index) => 
              `${index + 1}. From "${result.file?.filename}": ${result.content.substring(0, 300)}...`
            ).join('\n\n')
          }`
        }
      } catch (error) {
        console.error('Error performing RAG search:', error)
      }
    }

    // Get user's recent tasks for context
    try {
      const recentTasks = await taskOperations.getTasks(userId)
      const activeTasks = recentTasks.filter(task => 
        task.status === 'pending' || task.status === 'in_progress'
      ).slice(0, 3)

      if (activeTasks.length > 0) {
        taskContext = `\n\nUser's current active tasks:\n${
          activeTasks.map(task => 
            `- ${task.title} (${task.status}, priority: ${task.priority})`
          ).join('\n')
        }`
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error)
    }

    // Build conversation context with enhanced system prompt
    messages = [
      {
        role: 'system',
        content: `You are an AI assistant for a field service management application. 
        
        User Context:
        - Name: ${profile.full_name || 'User'}
        - Role: ${profile.role}
        - Email: ${profile.email}
        
        You help users with:
        1. Task management and coordination
        2. Document search and information retrieval  
        3. Field service best practices
        4. System navigation and usage
        5. Troubleshooting guidance
        6. Creating and managing service tasks
        7. Finding relevant documentation and procedures

        Role-based capabilities:
        ${profile.role === 'admin' || profile.role === 'supervisor' ? 
          '- You can help with team management, user assignments, and analytics\n- You have access to all system features and can provide administrative guidance' :
          '- You focus on individual task completion and field operations\n- You help with day-to-day service activities'
        }

        ${taskContext}
        ${ragContext}
        
        Guidelines:
        - Keep responses helpful, concise, and relevant to field service operations
        - When referencing documents, mention the source filename
        - If you suggest creating tasks or assignments, provide specific details
        - For troubleshooting, ask clarifying questions to better understand the issue
        - If you don't have enough information, ask the user for more details`
      }
    ]

    // Add conversation history (last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: { role: string; content: string }) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })



    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.'

    // Prepare context for storage
    const responseContext = {
      userRole: profile.role,
      conversationLength: messages.length,
      ragSearchPerformed: searchResults.length > 0,
      ragResultsCount: searchResults.length,
      searchQuery: shouldSearch ? message : null,
      taskContextIncluded: taskContext.length > 0,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      response,
      context: responseContext,
      searchResults: searchResults.map(result => ({
        filename: result.file?.filename,
        similarity: result.similarity,
        content: result.content.substring(0, 200) + '...'
      })),
      messageId: `msg_${Date.now()}`
    })

  } catch (error) {
    console.error('Error in AI chat:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('insufficient_quota')) {
        console.warn('OpenAI API issue, using fallback response')
        const fallbackResponse = generateFallbackResponse(message, profile?.role || 'technician', taskContext, ragContext)
        
        return NextResponse.json({
          response: fallbackResponse,
          context: {
            userRole: profile?.role || 'technician',
            conversationLength: messages?.length || 1,
            ragSearchPerformed: searchResults.length > 0,
            ragResultsCount: searchResults.length,
            searchQuery: shouldSearch ? message : null,
            taskContextIncluded: taskContext.length > 0,
            timestamp: new Date().toISOString(),
            fallback: true
          },
          searchResults: searchResults.map(result => ({
            filename: result.file?.filename,
            similarity: result.similarity,
            content: result.content.substring(0, 200) + '...'
          })),
          messageId: `msg_${Date.now()}`
        })
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        )
      }
    }

    // Check if it's an OpenAI API error with insufficient quota
    if (error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota') {
      console.warn('OpenAI quota exceeded, using fallback response')
      const fallbackResponse = generateFallbackResponse(message, profile?.role || 'technician', taskContext, ragContext)
      
      return NextResponse.json({
        response: fallbackResponse,
        context: {
          userRole: profile?.role || 'technician',
          conversationLength: messages?.length || 1,
          ragSearchPerformed: searchResults.length > 0,
          ragResultsCount: searchResults.length,
          searchQuery: shouldSearch ? message : null,
          taskContextIncluded: taskContext.length > 0,
          timestamp: new Date().toISOString(),
          fallback: true
        },
        searchResults: searchResults.map(result => ({
          filename: result.file?.filename,
          similarity: result.similarity,
          content: result.content.substring(0, 200) + '...'
        })),
        messageId: `msg_${Date.now()}`
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fallback response generator when OpenAI API is not available
function generateFallbackResponse(message: string, userRole: string, taskContext: string, ragContext: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Task-related responses
  if (lowerMessage.includes('task') || lowerMessage.includes('assignment')) {
    if (userRole === 'admin' || userRole === 'supervisor') {
      return "I can help you manage tasks and assignments. You can create new tasks, assign them to team members, and track their progress. Would you like me to help you create a specific task or review existing ones?"
    } else {
      return "I can help you with your tasks. You can view your assigned tasks, update their status, and add comments. What specific task would you like to work on?"
    }
  }
  
  // Search-related responses
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('document')) {
    if (ragContext) {
      return `I found some relevant information in your documents:${ragContext}\n\nWould you like me to search for more specific information?`
    } else {
      return "I can help you search through your uploaded documents and manuals. Try asking about specific procedures, equipment, or troubleshooting steps."
    }
  }
  
  // Help and guidance
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return `I'm here to help you with field service operations! I can assist with:

• Task management and coordination
• Searching through documents and manuals
• Field service best practices
• System navigation
• Troubleshooting guidance

${taskContext ? `\nI see you have some active tasks. Would you like help with any of them?` : ''}

What would you like help with today?`
  }
  
  // Troubleshooting
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error')) {
    return "I can help you troubleshoot issues. Please provide more details about the problem you're experiencing, including any error messages, equipment involved, and when the issue started."
  }
  
  // Default response
  return `Hello! I'm your AI assistant for field service management. I can help you with:

• Managing and creating tasks
• Searching through documentation
• Providing field service guidance
• System navigation help

${taskContext ? `\nI notice you have some active tasks. Would you like to review them?` : ''}

How can I assist you today?`
}