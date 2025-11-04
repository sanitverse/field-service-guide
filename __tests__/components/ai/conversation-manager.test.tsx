import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationManager } from '../../../components/ai/conversation-manager'
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

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

const mockInteractions = [
  {
    id: 'interaction-1',
    user_id: 'user-123',
    question: 'How do I search for documents?',
    response: 'You can search for documents using the search bar at the top of the page.',
    context: {},
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'interaction-2',
    user_id: 'user-123',
    question: 'What tasks do I have today?',
    response: 'You have 2 tasks scheduled for today: Installation and Maintenance.',
    context: {},
    created_at: '2024-01-01T11:00:00Z'
  },
  {
    id: 'interaction-3',
    user_id: 'user-123',
    question: 'How to troubleshoot equipment error?',
    response: 'First, check the power connections and restart the device.',
    context: {},
    created_at: '2024-01-02T09:00:00Z'
  }
]

describe('ConversationManager', () => {
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
  })

  it('renders conversation manager with loading state', () => {
    render(<ConversationManager />)
    
    expect(screen.getByText('Conversations')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument() // New conversation button
  })

  it('loads and displays conversation summaries', async () => {
    render(<ConversationManager />)
    
    await waitFor(() => {
      expect(mockAiOperations.getUserInteractions).toHaveBeenCalledWith('user-123', 100)
    })

    await waitFor(() => {
      // Should group conversations by date and show summaries
      expect(screen.getByText(/How do I search for documents/)).toBeInTheDocument()
      expect(screen.getByText(/How to troubleshoot equipment/)).toBeInTheDocument()
    })
  })

  it('categorizes conversations correctly', async () => {
    render(<ConversationManager />)
    
    await waitFor(() => {
      // Should show category badges
      expect(screen.getByText('Search')).toBeInTheDocument() // For search-related conversation
      expect(screen.getByText('Tasks')).toBeInTheDocument() // For task-related conversation
      expect(screen.getByText('Troubleshooting')).toBeInTheDocument() // For troubleshooting conversation
    })
  })

  it('handles conversation selection', async () => {
    const onConversationSelect = jest.fn()
    const user = userEvent.setup()
    
    render(<ConversationManager onConversationSelect={onConversationSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText(/How do I search for documents/)).toBeInTheDocument()
    })

    // Click on a conversation
    const conversationElement = screen.getByText(/How do I search for documents/).closest('div')
    if (conversationElement) {
      await user.click(conversationElement)
      expect(onConversationSelect).toHaveBeenCalled()
    }
  })

  it('highlights selected conversation', async () => {
    const selectedId = 'Mon Jan 01 2024' // Date-based conversation ID
    
    render(<ConversationManager selectedConversationId={selectedId} />)
    
    await waitFor(() => {
      const selectedConversation = screen.getByText(/How do I search for documents/).closest('div')
      expect(selectedConversation).toHaveClass('bg-muted', 'border-primary')
    })
  })

  it('handles new conversation creation', async () => {
    const onConversationSelect = jest.fn()
    const user = userEvent.setup()
    
    render(<ConversationManager onConversationSelect={onConversationSelect} />)
    
    const newButton = screen.getByRole('button')
    await user.click(newButton)
    
    expect(onConversationSelect).toHaveBeenCalledWith('new')
  })

  it('shows empty state when no conversations exist', async () => {
    mockAiOperations.getUserInteractions.mockResolvedValue([])
    
    render(<ConversationManager />)
    
    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument()
      expect(screen.getByText('Start chatting with your AI assistant')).toBeInTheDocument()
    })
  })

  it('displays conversation metadata correctly', async () => {
    render(<ConversationManager />)
    
    await waitFor(() => {
      // Should show message counts (each interaction = 2 messages: question + response)
      expect(screen.getByText('4 messages')).toBeInTheDocument() // 2 interactions on same day
      expect(screen.getByText('2 messages')).toBeInTheDocument() // 1 interaction on different day
    })
  })

  it('formats timestamps correctly', async () => {
    render(<ConversationManager />)
    
    await waitFor(() => {
      // Should show relative timestamps
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}|Jan \d{1,2}/)
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })

  it('handles conversation deletion', async () => {
    const user = userEvent.setup()
    
    render(<ConversationManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/How do I search for documents/)).toBeInTheDocument()
    })

    // Find and click delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // Looking for trash icon
    )
    
    if (deleteButtons.length > 1) { // Skip the "new conversation" button
      await user.click(deleteButtons[1])
      
      // Conversation should be removed from display
      await waitFor(() => {
        expect(screen.queryByText(/How do I search for documents/)).not.toBeInTheDocument()
      })
    }
  })

  it('generates appropriate conversation titles', async () => {
    render(<ConversationManager />)
    
    await waitFor(() => {
      // Should generate titles from first questions
      expect(screen.getByText(/How do I search for documents/)).toBeInTheDocument()
      expect(screen.getByText(/What tasks do I have today/)).toBeInTheDocument()
      expect(screen.getByText(/How to troubleshoot equipment error/)).toBeInTheDocument()
    })
  })

  it('handles loading errors gracefully', async () => {
    mockAiOperations.getUserInteractions.mockRejectedValue(new Error('Failed to load'))
    
    render(<ConversationManager />)
    
    await waitFor(() => {
      // Should show empty state when loading fails
      expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    })
  })
})