import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '../../../components/ai/chat-interface'
import { useAuth } from '../../../lib/auth-context'
import { aiOperations } from '../../../lib/database'
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
jest.mock('../../../lib/auth-context')
jest.mock('../../../lib/database')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockAiOperations = aiOperations as jest.Mocked<typeof aiOperations>

// Mock fetch for API calls
global.fetch = jest.fn()

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    avatar_url: 'https://example.com/avatar.jpg'
  }
}

const mockInteractions = [
  {
    id: 'interaction-1',
    user_id: 'user-123',
    question: 'How do I create a task?',
    response: 'To create a task, go to the Tasks section and click "New Task".',
    context: {},
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'interaction-2',
    user_id: 'user-123',
    question: 'What are my current tasks?',
    response: 'You have 3 active tasks: Installation at Site A, Repair at Site B, and Maintenance at Site C.',
    context: {},
    created_at: '2024-01-01T11:00:00Z'
  }
]

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'technician',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    })

    mockAiOperations.getUserInteractions.mockResolvedValue(mockInteractions)
    mockAiOperations.saveInteraction.mockResolvedValue({
      id: 'new-interaction',
      user_id: 'user-123',
      question: 'test question',
      response: 'test response',
      context: {},
      created_at: new Date().toISOString()
    })

    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'This is a test AI response',
        context: { userRole: 'technician' },
        messageId: 'msg_123'
      })
    })
  })

  it('renders chat interface with empty state', () => {
    mockAiOperations.getUserInteractions.mockResolvedValue([])
    
    render(<ChatInterface />)
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('Start a conversation with your AI assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('loads and displays conversation history', async () => {
    render(<ChatInterface />)
    
    await waitFor(() => {
      expect(mockAiOperations.getUserInteractions).toHaveBeenCalledWith('user-123', 20)
    })

    await waitFor(() => {
      expect(screen.getByText('How do I create a task?')).toBeInTheDocument()
      expect(screen.getByText('To create a task, go to the Tasks section and click "New Task".')).toBeInTheDocument()
    })
  })

  it('sends message and receives AI response', async () => {
    const user = userEvent.setup()
    const onMessageSent = jest.fn()
    
    render(<ChatInterface onMessageSent={onMessageSent} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')
    
    await user.type(input, 'Hello AI assistant')
    await user.click(sendButton)
    
    // Check that message was sent
    expect(screen.getByText('Hello AI assistant')).toBeInTheDocument()
    
    // Wait for AI response
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"message":"Hello AI assistant"')
      }))
    })

    await waitFor(() => {
      expect(screen.getByText('This is a test AI response')).toBeInTheDocument()
    })

    // Check that interaction was saved
    expect(mockAiOperations.saveInteraction).toHaveBeenCalledWith({
      user_id: 'user-123',
      question: 'Hello AI assistant',
      response: 'This is a test AI response',
      context: { userRole: 'technician' }
    })

    // Check callback was called
    expect(onMessageSent).toHaveBeenCalled()
  })

  it('handles Enter key to send message', async () => {
    const user = userEvent.setup()
    
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('disables input and button while loading', async () => {
    const user = userEvent.setup()
    
    // Mock delayed API response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Delayed response' })
      }), 100))
    )
    
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    // Check that input and button are disabled during loading
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error processing your message. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows typing indicator during AI response', async () => {
    const user = userEvent.setup()
    
    // Mock delayed API response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Response' })
      }), 100))
    )
    
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    // Check typing indicator appears
    await waitFor(() => {
      expect(screen.getByText('Typing...')).toBeInTheDocument()
    })
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByRole('button')
    
    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled()
    
    // Try to send empty message
    await user.click(sendButton)
    
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles conversation history context correctly', async () => {
    const user = userEvent.setup()
    
    render(<ChatInterface />)
    
    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText('How do I create a task?')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    await user.type(input, 'New message')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"message":"New message"')
      }))
    })
    
    // Verify conversation history was included
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1].body)
    expect(requestBody.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: 'How do I create a task?',
          role: 'user'
        })
      ])
    )
  })
})