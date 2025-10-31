import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '../../../components/tasks/task-form'
import { AuthProvider } from '../../../lib/auth-context'
import { NotificationProvider } from '../../../lib/notification-context'
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
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock dependencies
jest.mock('../../../lib/database', () => ({
  taskOperations: {
    createTask: jest.fn(),
    updateTask: jest.fn(),
  },
  profileOperations: {
    getAllProfiles: jest.fn(),
  },
}))
const mockTaskOperations = taskOperations as jest.Mocked<typeof taskOperations>
const mockProfileOperations = profileOperations as jest.Mocked<typeof profileOperations>

// Mock toast
const mockShowToast = jest.fn()
jest.mock('../../../lib/notification-context', () => ({
  ...jest.requireActual('../../../lib/notification-context'),
  useNotifications: () => ({
    showToast: mockShowToast,
  }),
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockProfiles = [
  {
    id: 'user-1',
    email: 'tech1@example.com',
    full_name: 'Technician One',
    role: 'technician' as const,
    status: 'active' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'supervisor@example.com',
    full_name: 'Supervisor User',
    role: 'supervisor' as const,
    status: 'active' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

// Mock useAuth hook
jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
    profile: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  }),
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

describe('TaskForm Component', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockProfileOperations.getAllProfiles.mockResolvedValue(mockProfiles)
  })

  it('renders create task form correctly', async () => {
    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Create New Task')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter task title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter task description')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Assign To')).toBeInTheDocument()
    expect(screen.getByText('Due Date')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
  })

  it('renders edit task form with existing task data', async () => {
    const existingTask = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'Task description',
      priority: 'high' as const,
      status: 'pending' as const,
      assigned_to: 'user-1',
      created_by: 'user-123',
      due_date: '2024-12-31T00:00:00Z',
      location: 'Test Location',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} task={existingTask} />
      </TestWrapper>
    )

    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Task description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('creates new task successfully', async () => {
    const user = userEvent.setup()
    const mockCreatedTask = {
      id: 'new-task-1',
      title: 'New Task',
      description: 'New task description',
      priority: 'medium' as const,
      status: 'pending' as const,
      assigned_to: 'user-1',
      created_by: 'user-123',
      due_date: null,
      location: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    mockTaskOperations.createTask.mockResolvedValue(mockCreatedTask)

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    // Fill in the form
    await user.type(screen.getByPlaceholderText('Enter task title'), 'New Task')
    await user.type(screen.getByPlaceholderText('Enter task description'), 'New task description')
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockTaskOperations.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'New task description',
          priority: 'medium',
          created_by: 'user-123',
        })
      )
    })

    expect(mockShowToast).toHaveBeenCalledWith('Task created successfully', 'success')
    expect(defaultProps.onSuccess).toHaveBeenCalled()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('updates existing task successfully', async () => {
    const user = userEvent.setup()
    const existingTask = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'Task description',
      priority: 'high' as const,
      status: 'pending' as const,
      assigned_to: 'user-1',
      created_by: 'user-123',
      due_date: null,
      location: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    const mockUpdatedTask = { ...existingTask, title: 'Updated Task' }
    mockTaskOperations.updateTask.mockResolvedValue(mockUpdatedTask)

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} task={existingTask} />
      </TestWrapper>
    )

    // Update the title
    const titleInput = screen.getByDisplayValue('Existing Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task')
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockTaskOperations.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'Updated Task',
          created_by: 'user-123',
        })
      )
    })

    expect(mockShowToast).toHaveBeenCalledWith('Task updated successfully', 'success')
  })

  it('loads assignable users on form open', async () => {
    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockProfileOperations.getAllProfiles).toHaveBeenCalled()
    })

    // Verify the form has the assign to field
    expect(screen.getByText('Assign To')).toBeInTheDocument()
  })

  it('handles task creation error', async () => {
    const user = userEvent.setup()
    mockTaskOperations.createTask.mockRejectedValue(new Error('Creation failed'))

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText('Enter task title'), 'New Task')
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to save task', 'error')
    })
  })

  it('shows notification when task is assigned', async () => {
    const user = userEvent.setup()
    const mockCreatedTask = {
      id: 'new-task-1',
      title: 'New Task',
      description: 'New task description',
      priority: 'medium' as const,
      status: 'pending' as const,
      assigned_to: 'user-1',
      created_by: 'user-123',
      due_date: null,
      location: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    mockTaskOperations.createTask.mockResolvedValue(mockCreatedTask)

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText('Enter task title'), 'New Task')
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Task created successfully', 'success')
      expect(mockShowToast).toHaveBeenCalledWith('Assignee has been notified', 'info')
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    // Mock a slow response
    mockTaskOperations.createTask.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        id: 'task-1',
        title: 'New Task',
        description: '',
        priority: 'medium' as const,
        status: 'pending' as const,
        assigned_to: null,
        created_by: 'user-123',
        due_date: null,
        location: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }), 100))
    )

    render(
      <TestWrapper>
        <TaskForm {...defaultProps} />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText('Enter task title'), 'New Task')
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })
})