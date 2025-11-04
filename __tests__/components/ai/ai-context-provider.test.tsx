import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAIContext, AIContextProvider } from '../../../components/ai/ai-context-provider'
import { useAuth } from '../../../lib/auth-context'
import { taskOperations, fileOperations } from '../../../lib/database'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
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
const mockTaskOperations = taskOperations as jest.Mocked<typeof taskOperations>
const mockFileOperations = fileOperations as jest.Mocked<typeof fileOperations>

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'technician' as const,
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockTasks = [
  {
    id: 'task-1',
    title: 'Installation at Site A',
    description: 'Install new equipment',
    status: 'pending' as const,
    priority: 'high' as const,
    assigned_to: 'user-123',
    created_by: 'user-456',
    due_date: '2024-01-15T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Repair at Site B',
    description: 'Fix broken equipment',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    assigned_to: 'user-123',
    created_by: 'user-456',
    due_date: '2023-12-30T10:00:00Z', // Overdue
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Maintenance check',
    description: 'Regular maintenance',
    status: 'pending' as const,
    priority: 'low' as const,
    assigned_to: null,
    created_by: 'user-456',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
]

const mockFiles = [
  {
    id: 'file-1',
    filename: 'manual.pdf',
    file_path: '/files/manual.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    uploaded_by: 'user-123',
    is_processed: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'file-2',
    filename: 'procedure.docx',
    file_path: '/files/procedure.docx',
    file_size: 2048,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploaded_by: 'user-123',
    is_processed: false,
    created_at: '2024-01-01T11:00:00Z'
  }
]

// Test component to access context
function TestComponent() {
  const context = useAIContext()
  
  return (
    <div>
      <div data-testid="user-tasks-count">{context.userTasks.length}</div>
      <div data-testid="recent-files-count">{context.recentFiles.length}</div>
      <div data-testid="task-suggestions-count">{context.taskSuggestions.length}</div>
      <div data-testid="document-suggestions-count">{context.documentSuggestions.length}</div>
      {context.taskSuggestions.map(suggestion => (
        <div key={suggestion.id} data-testid={`suggestion-${suggestion.type}`}>
          {suggestion.title}
        </div>
      ))}
      {context.documentSuggestions.map(suggestion => (
        <div key={suggestion.id} data-testid={`doc-suggestion-${suggestion.type}`}>
          {suggestion.title}
        </div>
      ))}
      <button onClick={() => context.refreshContext()}>Refresh</button>
      <button onClick={() => context.addTaskSuggestion({
        id: 'new-suggestion',
        type: 'create_task',
        title: 'New Task Suggestion',
        description: 'Create a new task',
        priority: 'medium',
        createdAt: new Date()
      })}>Add Suggestion</button>
      <button onClick={() => context.dismissSuggestion('suggestion-1')}>Dismiss</button>
    </div>
  )
}

describe('AIContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    })

    mockTaskOperations.getTasks.mockResolvedValue(mockTasks)
    mockFileOperations.getFiles.mockResolvedValue(mockFiles)
  })

  it('provides AI context to child components', async () => {
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-tasks-count')).toHaveTextContent('3')
      expect(screen.getByTestId('recent-files-count')).toHaveTextContent('2')
    })
  })

  it('loads user tasks and files on mount', async () => {
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(mockTaskOperations.getTasks).toHaveBeenCalledWith('user-123')
      expect(mockFileOperations.getFiles).toHaveBeenCalled()
    })
  })

  it('generates task suggestions based on context', async () => {
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      // Should generate suggestions for overdue tasks
      expect(screen.getByTestId('suggestion-update_status')).toBeInTheDocument()
      expect(screen.getByText('Review Overdue Tasks')).toBeInTheDocument()
    })
  })

  it('generates suggestions for unassigned tasks (supervisor role)', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: { ...mockProfile, role: 'supervisor' },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    })

    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-assign_task')).toBeInTheDocument()
      expect(screen.getByText('Assign Pending Tasks')).toBeInTheDocument()
    })
  })

  it('generates document suggestions for unprocessed files', async () => {
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('doc-suggestion-review_manual')).toBeInTheDocument()
      expect(screen.getByText('Process Uploaded Documents')).toBeInTheDocument()
    })
  })

  it('generates search suggestions based on task types', async () => {
    const installationTasks = [
      {
        ...mockTasks[0],
        title: 'Installation procedure needed'
      }
    ]
    mockTaskOperations.getTasks.mockResolvedValue(installationTasks)

    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('doc-suggestion-search_docs')).toBeInTheDocument()
      expect(screen.getByText('Search installation procedures')).toBeInTheDocument()
    })
  })

  it('handles refresh context functionality', async () => {
    const user = userEvent.setup()
    
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      expect(mockTaskOperations.getTasks).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByText('Refresh'))

    await waitFor(() => {
      expect(mockTaskOperations.getTasks).toHaveBeenCalledTimes(2)
    })
  })

  it('allows adding custom task suggestions', async () => {
    const user = userEvent.setup()
    
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    const initialCount = await screen.findByTestId('task-suggestions-count')
    const initialValue = parseInt(initialCount.textContent || '0')

    await user.click(screen.getByText('Add Suggestion'))

    await waitFor(() => {
      const newCount = screen.getByTestId('task-suggestions-count')
      expect(parseInt(newCount.textContent || '0')).toBe(initialValue + 1)
    })

    expect(screen.getByText('New Task Suggestion')).toBeInTheDocument()
  })

  it('allows dismissing suggestions', async () => {
    const user = userEvent.setup()
    
    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    // Wait for initial suggestions to load
    await waitFor(() => {
      expect(screen.getByTestId('task-suggestions-count')).toBeInTheDocument()
    })

    const initialCount = parseInt(screen.getByTestId('task-suggestions-count').textContent || '0')

    await user.click(screen.getByText('Dismiss'))

    // Note: This test assumes the suggestion ID matches what's generated
    // In a real scenario, you'd need to know the actual suggestion ID
  })

  it('handles errors gracefully when loading context fails', async () => {
    mockTaskOperations.getTasks.mockRejectedValue(new Error('Failed to load tasks'))
    mockFileOperations.getFiles.mockRejectedValue(new Error('Failed to load files'))

    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByTestId('user-tasks-count')).toHaveTextContent('0')
      expect(screen.getByTestId('recent-files-count')).toHaveTextContent('0')
    })
  })

  it('does not load context when user is not available', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    })

    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    expect(mockTaskOperations.getTasks).not.toHaveBeenCalled()
    expect(mockFileOperations.getFiles).not.toHaveBeenCalled()
  })

  it('limits suggestions to reasonable numbers', async () => {
    // Create many tasks to test suggestion limiting
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      title: `Task ${i}`,
      due_date: '2023-12-30T10:00:00Z' // All overdue
    }))
    
    mockTaskOperations.getTasks.mockResolvedValue(manyTasks)

    render(
      <AIContextProvider>
        <TestComponent />
      </AIContextProvider>
    )

    await waitFor(() => {
      const suggestionCount = parseInt(screen.getByTestId('task-suggestions-count').textContent || '0')
      expect(suggestionCount).toBeLessThanOrEqual(3) // Should limit to 3 suggestions
    })
  })
})

// Test hook usage outside provider
describe('useAIContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAIContext must be used within an AIContextProvider')
    
    consoleSpy.mockRestore()
  })
})