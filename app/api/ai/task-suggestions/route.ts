import { NextRequest, NextResponse } from 'next/server'

import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  let input = ''
  let userRole = 'technician'
  
  try {
    // For now, we'll skip auth check in the API route
    // In production, you'd want to implement proper auth validation

    const requestData: {
      input: string;
      userId: string;
      userRole: string;
      existingTasks: Array<{ title: string; status: string; priority: string }>;
    } = await request.json()

    input = requestData.input
    userRole = requestData.userRole
    const { userId, existingTasks } = requestData

    if (!input || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build context from existing tasks
    const taskContext = existingTasks && existingTasks.length > 0 
      ? `\n\nUser's recent tasks for context:\n${existingTasks.map((task: any) => 
          `- ${task.title} (${task.status}, ${task.priority} priority)`
        ).join('\n')}`
      : ''

    // Create AI prompt for task suggestions
    const prompt = `You are an AI assistant for a field service management application. Generate 2-3 specific, actionable task suggestions based on the user's input.

User Role: ${userRole}
User Input: "${input}"
${taskContext}

For each task suggestion, provide:
1. A clear, specific title
2. Detailed description with actionable steps
3. Appropriate priority level (low, medium, high, urgent)
4. Estimated duration
5. Suggested category (maintenance, repair, inspection, installation, emergency, etc.)
6. Location if mentioned or can be inferred
7. Suggested assignee role if applicable
8. Due date suggestion if urgent
9. Brief reasoning for the suggestion

Consider:
- Field service best practices
- Safety requirements
- Resource allocation
- Urgency and priority
- Customer impact
- Seasonal factors
- Equipment lifecycle

Respond with a JSON object containing an array of suggestions with this structure:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string", 
      "priority": "low|medium|high|urgent",
      "estimatedDuration": "string (e.g., '2-3 hours', '1 day')",
      "category": "string",
      "location": "string (if applicable)",
      "suggestedAssignee": "string (role or null)",
      "dueDate": "string (ISO date if urgent, null otherwise)",
      "reasoning": "string (brief explanation)"
    }
  ]
}`



    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: input
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from AI')
    }

    try {
      const parsedResponse = JSON.parse(response)
      
      // Validate the response structure
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        throw new Error('Invalid response structure')
      }

      // Enhance suggestions with additional context
      const enhancedSuggestions = parsedResponse.suggestions.map((suggestion: {
        priority: string;
        dueDate?: string;
        [key: string]: unknown;
      }) => {
        // Set default due date for urgent tasks
        if (suggestion.priority === 'urgent' && !suggestion.dueDate) {
          const urgentDate = new Date()
          urgentDate.setHours(urgentDate.getHours() + 4) // 4 hours from now
          suggestion.dueDate = urgentDate.toISOString()
        }

        // Set default due date for high priority tasks
        if (suggestion.priority === 'high' && !suggestion.dueDate) {
          const highPriorityDate = new Date()
          highPriorityDate.setDate(highPriorityDate.getDate() + 1) // Tomorrow
          suggestion.dueDate = highPriorityDate.toISOString()
        }

        return suggestion
      })

      return NextResponse.json({
        suggestions: enhancedSuggestions,
        generatedAt: new Date().toISOString()
      })

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      
      // Fallback: create a basic suggestion from the input
      const fallbackSuggestion = {
        title: input.length > 50 ? input.substring(0, 47) + '...' : input,
        description: `Task created from: ${input}`,
        priority: 'medium',
        estimatedDuration: '2-4 hours',
        category: 'general',
        location: null,
        suggestedAssignee: null,
        dueDate: null,
        reasoning: 'Basic task created from user input'
      }

      return NextResponse.json({
        suggestions: [fallbackSuggestion],
        generatedAt: new Date().toISOString(),
        fallback: true
      })
    }

  } catch (error) {
    console.error('Error generating task suggestions:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('insufficient_quota')) {
        console.warn('OpenAI API issue, using fallback task suggestions')
        const fallbackSuggestions = generateFallbackTaskSuggestions(input, userRole)
        
        return NextResponse.json({
          suggestions: fallbackSuggestions,
          generatedAt: new Date().toISOString(),
          fallback: true
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
      console.warn('OpenAI quota exceeded, using fallback task suggestions')
      const fallbackSuggestions = generateFallbackTaskSuggestions(input, userRole)
      
      return NextResponse.json({
        suggestions: fallbackSuggestions,
        generatedAt: new Date().toISOString(),
        fallback: true
      })
    }

    return NextResponse.json(
      { error: 'Failed to generate task suggestions' },
      { status: 500 }
    )
  }
}

// Fallback task suggestions when OpenAI API is not available
function generateFallbackTaskSuggestions(input: string, userRole: string) {
  const lowerInput = input.toLowerCase()
  const suggestions = []
  
  // Determine task type and priority based on keywords
  let priority = 'medium'
  let category = 'general'
  let estimatedDuration = '2-4 hours'
  
  if (lowerInput.includes('emergency') || lowerInput.includes('urgent') || lowerInput.includes('critical')) {
    priority = 'urgent'
    estimatedDuration = '1-2 hours'
  } else if (lowerInput.includes('repair') || lowerInput.includes('fix') || lowerInput.includes('broken')) {
    priority = 'high'
    category = 'repair'
    estimatedDuration = '3-6 hours'
  } else if (lowerInput.includes('maintenance') || lowerInput.includes('inspect') || lowerInput.includes('check')) {
    priority = 'medium'
    category = 'maintenance'
    estimatedDuration = '1-3 hours'
  } else if (lowerInput.includes('install') || lowerInput.includes('setup')) {
    priority = 'medium'
    category = 'installation'
    estimatedDuration = '4-8 hours'
  }
  
  // Extract location if mentioned
  let location = null
  const locationKeywords = ['at ', 'in ', 'on ', 'building', 'floor', 'room', 'site']
  for (const keyword of locationKeywords) {
    const index = lowerInput.indexOf(keyword)
    if (index !== -1) {
      const locationPart = input.substring(index).split(' ').slice(0, 4).join(' ')
      location = locationPart
      break
    }
  }
  
  // Generate primary suggestion
  const primarySuggestion = {
    title: input.length > 50 ? input.substring(0, 47) + '...' : input,
    description: `Address the following: ${input}. Ensure proper safety protocols are followed and document all actions taken.`,
    priority,
    estimatedDuration,
    category,
    location,
    suggestedAssignee: userRole === 'admin' || userRole === 'supervisor' ? 'technician' : null,
    dueDate: priority === 'urgent' ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() : null,
    reasoning: `Based on the input keywords, this appears to be a ${category} task with ${priority} priority.`
  }
  
  suggestions.push(primarySuggestion)
  
  // Add follow-up suggestion if appropriate
  if (category === 'repair') {
    suggestions.push({
      title: 'Follow-up Inspection',
      description: 'Schedule a follow-up inspection to ensure the repair was successful and no additional issues exist.',
      priority: 'low',
      estimatedDuration: '30 minutes',
      category: 'inspection',
      location,
      suggestedAssignee: userRole === 'admin' || userRole === 'supervisor' ? 'technician' : null,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week later
      reasoning: 'Follow-up inspections help ensure repair quality and prevent recurring issues.'
    })
  }
  
  // Add documentation task for complex work
  if (priority === 'high' || priority === 'urgent') {
    suggestions.push({
      title: 'Update Documentation',
      description: 'Document the completed work, including any parts used, procedures followed, and recommendations for future maintenance.',
      priority: 'low',
      estimatedDuration: '15 minutes',
      category: 'documentation',
      location: null,
      suggestedAssignee: null,
      dueDate: null,
      reasoning: 'Proper documentation helps with future maintenance and troubleshooting.'
    })
  }
  
  return suggestions.slice(0, 3) // Return max 3 suggestions
}