import { NextRequest } from 'next/server'
import { POST } from '../../../app/api/ai/chat/route'
import { openai } from '../../../lib/openai'
import { searchDocumentChunks } from '../../../lib/document-processing'
import { taskOperations, profileOperations } from '../../../lib/database'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock dependencies
jest.mock('../../../lib/openai')
jest.mock('../../../lib/document-processing')
jest.mock('../../../lib/database')

const mockOpenai = openai as jest.Mocked<typeof openai>
const mockSearchDocumentChunks = searchDocumentChunks as jest.MockedFunction<typeof searchDocumentChunks>
const mockTaskOperations = taskOperations as jest.Mocked<typeof taskOperations>
const mockProfileOperations = profileOperations as jest.Mocked<typeof profileOperations>

const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'technician',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockTasks = [
  {
    id: 'task-1',
    title: 'Installation at Site A',
    status: 'pending',
    priority: 'high',
    assigned_to: 'user-123',
    created_by: 'user-456',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
]

const mockSearchResults = [
  {
    file: { filename: 'installation-manual.pdf' },
    content: 'Installation procedure: First, ensure power is disconnected...',
    similarity: 0.85
  },
  {
    file: { filename: 'safety-guide.pdf' },
    content: 'Safety requirements for installation work...',
    similarity: 0.78
  }
]

describe('/api/ai/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockProfileOperations.getProfile.mockResolvedValue(mockProfile)
    mockTaskOperations.getTasks.mockResolvedValue(mockTasks)
    mockSearchDocumentChunks.mockResolvedValue(mockSearchResults)
    
    // Mock OpenAI response
    mockOpenai.chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'This is a helpful AI response about your field service question.'
            }
          }]
        })
      }
    } as any
  })

  it('handles basic chat message successfully', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, how can you help me?',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toBe('This is a helpful AI response about your field service question.')
    expect(data.context).toMatchObject({
      userRole: 'technician',
      conversationLength: expect.any(Number),
      ragSearchPerformed: false,
      taskContextIncluded: true
    })
  })

  it('performs RAG search for information queries', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'How do I install the new equipment?',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(mockSearchDocumentChunks).toHaveBeenCalledWith(
      'How do I install the new equipment?',
      {
        matchThreshold: 0.75,
        matchCount: 5
      }
    )

    expect(data.context.ragSearchPerformed).toBe(true)
    expect(data.context.ragResultsCount).toBe(2)
    expect(data.searchResults).toHaveLength(2)
    expect(data.searchResults[0]).toMatchObject({
      filename: 'installation-manual.pdf',
      similarity: 0.85,
      content: expect.stringContaining('Installation procedure')
    })
  })

  it('includes user task context in AI prompt', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What are my current tasks?',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    await POST(request)

    expect(mockTaskOperations.getTasks).toHaveBeenCalledWith('user-123')
    expect(mockOpenai.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Installation at Site A (pending, priority: high)')
        })
      ]),
      max_tokens: 500,
      temperature: 0.7
    })
  })

  it('handles conversation history correctly', async () => {
    const conversationHistory = [
      { role: 'user', content: 'Previous question' },
      { role: 'assistant', content: 'Previous response' }
    ]

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Follow-up question',
        userId: 'user-123',
        conversationHistory
      })
    })

    await POST(request)

    expect(mockOpenai.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: 'Previous question'
        }),
        expect.objectContaining({
          role: 'assistant',
          content: 'Previous response'
        }),
        expect.objectContaining({
          role: 'user',
          content: 'Follow-up question'
        })
      ]),
      max_tokens: 500,
      temperature: 0.7
    })
  })

  it('adapts system prompt based on user role', async () => {
    mockProfileOperations.getProfile.mockResolvedValue({
      ...mockProfile,
      role: 'supervisor'
    })

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Help me manage my team',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    await POST(request)

    expect(mockOpenai.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('You can help with team management, user assignments, and analytics')
        })
      ]),
      max_tokens: 500,
      temperature: 0.7
    })
  })

  it('handles missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello'
        // Missing userId
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('handles OpenAI API errors with fallback response', async () => {
    mockOpenai.chat.completions.create = jest.fn().mockRejectedValue(
      new Error('API key not found')
    )

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Help me with tasks',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toContain('I can help you with your tasks')
    expect(data.context.fallback).toBe(true)
  })

  it('handles rate limit errors appropriately', async () => {
    mockOpenai.chat.completions.create = jest.fn().mockRejectedValue(
      new Error('rate limit')
    )

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('temporarily unavailable')
  })

  it('handles insufficient quota errors with fallback', async () => {
    const quotaError = new Error('Insufficient quota')
    quotaError.code = 'insufficient_quota'
    
    mockOpenai.chat.completions.create = jest.fn().mockRejectedValue(quotaError)

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Search for documents',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.context.fallback).toBe(true)
    expect(data.response).toContain('I found some relevant information')
  })

  it('generates appropriate fallback responses for different query types', async () => {
    mockOpenai.chat.completions.create = jest.fn().mockRejectedValue(
      new Error('API unavailable')
    )

    // Test task-related query
    const taskRequest = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Help me create a task',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const taskResponse = await POST(taskRequest)
    const taskData = await taskResponse.json()

    expect(taskData.response).toContain('I can help you with your tasks')

    // Test search-related query
    const searchRequest = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Find installation procedures',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const searchResponse = await POST(searchRequest)
    const searchData = await searchResponse.json()

    expect(searchData.response).toContain('I found some relevant information')
  })

  it('handles RAG search errors gracefully', async () => {
    mockSearchDocumentChunks.mockRejectedValue(new Error('Search failed'))

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Find installation manual',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.context.ragSearchPerformed).toBe(false)
    expect(data.context.ragResultsCount).toBe(0)
  })

  it('handles task loading errors gracefully', async () => {
    mockTaskOperations.getTasks.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What are my tasks?',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.context.taskContextIncluded).toBe(false)
  })

  it('creates mock profile when user profile not found', async () => {
    mockProfileOperations.getProfile.mockResolvedValue(null)
    mockProfileOperations.createMockProfile.mockReturnValue({
      ...mockProfile,
      full_name: 'Test User',
      role: 'technician'
    })

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        userId: 'user-123',
        conversationHistory: []
      })
    })

    await POST(request)

    expect(mockProfileOperations.createMockProfile).toHaveBeenCalledWith(
      'user-123',
      'user@example.com',
      'Test User',
      'technician'
    )
  })

  it('limits conversation history to last 10 messages', async () => {
    const longHistory = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`
    }))

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Current message',
        userId: 'user-123',
        conversationHistory: longHistory
      })
    })

    await POST(request)

    const callArgs = mockOpenai.chat.completions.create.mock.calls[0][0]
    const userMessages = callArgs.messages.filter(msg => msg.role === 'user' || msg.role === 'assistant')
    
    // Should include system message + last 10 history messages + current message
    expect(userMessages.length).toBeLessThanOrEqual(11) // 10 history + 1 current
  })
})