import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from '../../../components/tasks/task-card'
import { taskOperations } from '../../../lib/database'
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
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock dependencies
jest.mock('../../../lib/database', () => ({
  taskOperations: {
    updateTask: jest.fn(),
  },
}))
const mockTaskOperations = taskOperations as jest.Mocked<typeof taskOperations>

// Mock toast
const mockShowToast = jest.fn()
jest.mock('../../../lib/notification-context', () => ({
  useNotifications: () => ({
    showToast: mockShowToast,
  }),
}))

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  priority: 'high' as const,
  status: 'pending' as const,
  assigned_to: 'user-1',
  created_by: 'user-admin',
  due_date: '2024-12-31T00:00:00Z',
  location: 'Building A',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  assignee: {
    id: 'user-1',
    full_name: 'John Technician',
    email: 'john@example.com',
  },
  creator: {
    id: 'user-admin',
    full_name: 'Admin User',
    email: 'admin@example.com',
  },
}

describe('TaskCard Component', () => {
  const defaultProps = {
    task: mockTask,
    onEdit: jest.fn(),
    onView: jest.fn(),
    onRefresh: jest.fn(),
    currentUserId: 'user-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task information correctly', () => {
    render(<TaskCard {...defaultProps} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('This is a test task description')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('John Technician')).toBeInTheDocument()
    expect(screen.getByText('Building A')).toBeInTheDocument()
    expect(screen.getByText('Created by Admin User')).toBeInTheDocument()
  })

  it('displays due date correctly', () => {
    render(<TaskCard {...defaultProps} />)

    expect(screen.getByText(/Due Dec 31, 2024/)).toBeInTheDocument()
  })

  it('shows overdue indicator for past due tasks', () => {
    const overdueTask = {
      ...mockTask,
      due_date: '2023-01-01T00:00:00Z', // Past date
      status: 'pending' as const,
    }

    render(<TaskCard {...defaultProps} task={overdueTask} />)

    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('does not show overdue for completed tasks', () => {
    const completedTask = {
      ...mockTask,
      due_date: '2023-01-01T00:00:00Z', // Past date
      status: 'completed' as const,
    }

    render(<TaskCard {...defaultProps} task={completedTask} />)

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })

  it('handles task without assignee', () => {
    const unassignedTask = {
      ...mockTask,
      assigned_to: null,
      assignee: null,
    }

    render(<TaskCard {...defaultProps} task={unassignedTask} />)

    expect(screen.queryByText('John Technician')).not.toBeInTheDocument()
  })

  it('handles task without location', () => {
    const taskWithoutLocation = {
      ...mockTask,
      location: null,
    }

    render(<TaskCard {...defaultProps} task={taskWithoutLocation} />)

    expect(screen.queryByText('Building A')).not.toBeInTheDocument()
  })

  it('handles task without due date', () => {
    const taskWithoutDueDate = {
      ...mockTask,
      due_date: null,
    }

    render(<TaskCard {...defaultProps} task={taskWithoutDueDate} />)

    expect(screen.queryByText(/Due/)).not.toBeInTheDocument()
  })

  it('opens actions menu and shows available actions', async () => {
    const user = userEvent.setup()
    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByText('Mark In Progress')).toBeInTheDocument()
    expect(screen.getByText('Mark Completed')).toBeInTheDocument()
    expect(screen.getByText('Cancel Task')).toBeInTheDocument()
  })

  it('calls onView when view action is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const viewButton = screen.getByText('View Details')
    await user.click(viewButton)

    expect(defaultProps.onView).toHaveBeenCalledWith(mockTask)
  })

  it('calls onEdit when edit action is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const editButton = screen.getByText('Edit Task')
    await user.click(editButton)

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('updates task status successfully', async () => {
    const user = userEvent.setup()
    const updatedTask = { ...mockTask, status: 'in_progress' as const }
    mockTaskOperations.updateTask.mockResolvedValue(updatedTask)

    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const markInProgressButton = screen.getByText('Mark In Progress')
    await user.click(markInProgressButton)

    await waitFor(() => {
      expect(mockTaskOperations.updateTask).toHaveBeenCalledWith('task-1', { status: 'in_progress' })
    })

    expect(mockShowToast).toHaveBeenCalledWith('Task status updated to in progress', 'success')
    expect(defaultProps.onRefresh).toHaveBeenCalled()
  })

  it('handles task status update error', async () => {
    const user = userEvent.setup()
    mockTaskOperations.updateTask.mockRejectedValue(new Error('Update failed'))

    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const markInProgressButton = screen.getByText('Mark In Progress')
    await user.click(markInProgressButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to update task status', 'error')
    })
  })

  it('disables actions during status update', async () => {
    const user = userEvent.setup()
    // Mock slow response
    mockTaskOperations.updateTask.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockTask), 100))
    )

    render(<TaskCard {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const markInProgressButton = screen.getByText('Mark In Progress')
    await user.click(markInProgressButton)

    // Menu should close and actions should be disabled
    expect(screen.queryByText('Mark Completed')).not.toBeInTheDocument()
  })

  it('shows different status icons correctly', () => {
    const statuses = [
      { status: 'pending' as const, expectedText: 'Pending' },
      { status: 'in_progress' as const, expectedText: 'In Progress' },
      { status: 'completed' as const, expectedText: 'Completed' },
      { status: 'cancelled' as const, expectedText: 'Cancelled' },
    ]

    statuses.forEach(({ status, expectedText }) => {
      const taskWithStatus = { ...mockTask, status }
      const { rerender } = render(<TaskCard {...defaultProps} task={taskWithStatus} />)
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('shows different priority badges correctly', () => {
    const priorities = [
      { priority: 'low' as const, expectedText: 'Low' },
      { priority: 'medium' as const, expectedText: 'Medium' },
      { priority: 'high' as const, expectedText: 'High' },
      { priority: 'urgent' as const, expectedText: 'Urgent' },
    ]

    priorities.forEach(({ priority, expectedText }) => {
      const taskWithPriority = { ...mockTask, priority }
      const { rerender } = render(<TaskCard {...defaultProps} task={taskWithPriority} />)
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('does not show edit actions for non-authorized users', async () => {
    const user = userEvent.setup()
    const unauthorizedProps = {
      ...defaultProps,
      currentUserId: 'different-user',
    }

    render(<TaskCard {...unauthorizedProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.queryByText('Edit Task')).not.toBeInTheDocument()
    expect(screen.queryByText('Mark In Progress')).not.toBeInTheDocument()
  })

  it('shows edit actions for task creator', async () => {
    const user = userEvent.setup()
    const creatorProps = {
      ...defaultProps,
      currentUserId: 'user-admin', // Task creator
    }

    render(<TaskCard {...creatorProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByText('Mark In Progress')).toBeInTheDocument()
  })

  it('shows edit actions for task assignee', async () => {
    const user = userEvent.setup()
    const assigneeProps = {
      ...defaultProps,
      currentUserId: 'user-1', // Task assignee
    }

    render(<TaskCard {...assigneeProps} />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByText('Mark In Progress')).toBeInTheDocument()
  })
})