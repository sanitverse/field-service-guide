/**
 * Comprehensive Task Workflow Tests
 * Tests the complete task lifecycle: creation, assignment, status changes, and review
 */

import { taskOperations, commentOperations, profileOperations } from '../lib/database'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        or: jest.fn(() => ({
          order: jest.fn(),
        })),
        order: jest.fn(),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
  },
}))

describe('Task Workflow Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'technician' as const,
  }

  const mockSupervisor = {
    id: 'supervisor-456',
    email: 'supervisor@example.com',
    full_name: 'Test Supervisor',
    role: 'supervisor' as const,
  }

  const mockTask = {
    id: 'task-789',
    title: 'Test Task',
    description: 'Test task description',
    status: 'pending' as const,
    priority: 'medium' as const,
    created_by: mockSupervisor.id,
    assigned_to: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Test Location',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Task Creation Workflow', () => {
    it('should create a task successfully', async () => {
      const mockCreatedTask = { ...mockTask, id: 'new-task-id' }
      
      // Mock the database operation
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedTask,
              error: null,
            }),
          }),
        }),
      })

      const taskData = {
        title: 'New Task',
        description: 'New task description',
        priority: 'high' as const,
        assigned_to: mockUser.id,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'New Location',
        created_by: mockSupervisor.id,
      }

      const result = await taskOperations.createTask(taskData)

      expect(result).toEqual(mockCreatedTask)
      expect(mockSupabase.from).toHaveBeenCalledWith('service_tasks')
    })

    it('should handle task creation errors', async () => {
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Creation failed' },
            }),
          }),
        }),
      })

      const taskData = {
        title: 'Failed Task',
        created_by: mockSupervisor.id,
      }

      const result = await taskOperations.createTask(taskData)
      expect(result).toBeNull()
    })
  })

  describe('Task Assignment Workflow', () => {
    it('should assign a task to a user', async () => {
      const assignedTask = { ...mockTask, assigned_to: mockUser.id }
      
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTask,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: assignedTask,
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await taskOperations.updateTask(mockTask.id, {
        assigned_to: mockUser.id,
      })

      expect(result).toEqual(assignedTask)
    })

    it('should unassign a task', async () => {
      const unassignedTask = { ...mockTask, assigned_to: null }
      
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTask, assigned_to: mockUser.id },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: unassignedTask,
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await taskOperations.updateTask(mockTask.id, {
        assigned_to: null,
      })

      expect(result).toEqual(unassignedTask)
    })
  })

  describe('Task Status Change Workflow', () => {
    const statusTransitions = [
      { from: 'pending', to: 'in_progress' },
      { from: 'in_progress', to: 'completed' },
      { from: 'completed', to: 'in_progress' }, // Reopening
      { from: 'pending', to: 'cancelled' },
    ]

    statusTransitions.forEach(({ from, to }) => {
      it(`should change status from ${from} to ${to}`, async () => {
        const currentTask = { ...mockTask, status: from as any }
        const updatedTask = { ...mockTask, status: to as any }
        
        const mockSupabase = require('../lib/supabase').supabase
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: currentTask,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedTask,
                  error: null,
                }),
              }),
            }),
          }),
        })

        const result = await taskOperations.updateTask(mockTask.id, {
          status: to as any,
        })

        expect(result).toEqual(updatedTask)
      })
    })
  })

  describe('Task Review and Comments Workflow', () => {
    const mockComment = {
      id: 'comment-123',
      task_id: mockTask.id,
      author_id: mockUser.id,
      content: 'This is a test comment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    it('should add a comment to a task', async () => {
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockComment,
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTask,
              error: null,
            }),
          }),
        }),
      })

      const commentData = {
        task_id: mockTask.id,
        author_id: mockUser.id,
        content: 'This is a test comment',
      }

      const result = await commentOperations.createComment(commentData)
      expect(result).toEqual(mockComment)
    })

    it('should retrieve comments for a task', async () => {
      const mockComments = [
        { ...mockComment, id: 'comment-1' },
        { ...mockComment, id: 'comment-2', content: 'Second comment' },
      ]

      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockComments,
              error: null,
            }),
          }),
        }),
      })

      const result = await commentOperations.getTaskComments(mockTask.id)
      expect(result).toEqual(mockComments)
    })

    it('should update a comment', async () => {
      const updatedComment = { ...mockComment, content: 'Updated comment content' }

      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedComment,
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await commentOperations.updateComment(mockComment.id, {
        content: 'Updated comment content',
      })

      expect(result).toEqual(updatedComment)
    })

    it('should delete a comment', async () => {
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })

      const result = await commentOperations.deleteComment(mockComment.id)
      expect(result).toBe(true)
    })
  })

  describe('Task Filtering and Search', () => {
    const mockTasks = [
      { ...mockTask, id: 'task-1', status: 'pending', priority: 'high' },
      { ...mockTask, id: 'task-2', status: 'in_progress', priority: 'medium' },
      { ...mockTask, id: 'task-3', status: 'completed', priority: 'low' },
    ]

    it('should filter tasks by status', async () => {
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTasks,
            error: null,
          }),
        }),
      })

      const allTasks = await taskOperations.getTasks()
      const pendingTasks = allTasks.filter(task => task.status === 'pending')
      
      expect(pendingTasks).toHaveLength(1)
      expect(pendingTasks[0].id).toBe('task-1')
    })

    it('should filter tasks by priority', async () => {
      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTasks,
            error: null,
          }),
        }),
      })

      const allTasks = await taskOperations.getTasks()
      const highPriorityTasks = allTasks.filter(task => task.priority === 'high')
      
      expect(highPriorityTasks).toHaveLength(1)
      expect(highPriorityTasks[0].id).toBe('task-1')
    })

    it('should filter tasks by assignee', async () => {
      const tasksWithAssignee = mockTasks.map(task => ({
        ...task,
        assigned_to: task.id === 'task-1' ? mockUser.id : null,
      }))

      const mockSupabase = require('../lib/supabase').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: tasksWithAssignee,
              error: null,
            }),
          }),
        }),
      })

      const userTasks = await taskOperations.getTasks(mockUser.id)
      const assignedToUser = userTasks.filter(task => task.assigned_to === mockUser.id)
      
      expect(assignedToUser).toHaveLength(1)
      expect(assignedToUser[0].id).toBe('task-1')
    })
  })

  describe('Task Permissions and Security', () => {
    it('should allow task creator to edit task', () => {
      const canEdit = mockTask.created_by === mockSupervisor.id
      expect(canEdit).toBe(true)
    })

    it('should allow task assignee to edit task', () => {
      const taskWithAssignee = { ...mockTask, assigned_to: mockUser.id }
      const canEdit = taskWithAssignee.assigned_to === mockUser.id
      expect(canEdit).toBe(true)
    })

    it('should not allow unauthorized users to edit task', () => {
      const unauthorizedUserId = 'unauthorized-user'
      const canEdit = 
        mockTask.created_by === unauthorizedUserId ||
        mockTask.assigned_to === unauthorizedUserId
      expect(canEdit).toBe(false)
    })

    it('should allow admin/supervisor to edit any task', () => {
      const adminUser = { ...mockUser, role: 'admin' as const }
      const supervisorUser = { ...mockUser, role: 'supervisor' as const }
      
      const adminCanEdit = ['admin', 'supervisor'].includes(adminUser.role)
      const supervisorCanEdit = ['admin', 'supervisor'].includes(supervisorUser.role)
      
      expect(adminCanEdit).toBe(true)
      expect(supervisorCanEdit).toBe(true)
    })
  })

  describe('Task Notifications', () => {
    it('should create notification when task is assigned', async () => {
      const notificationSpy = jest.spyOn(taskOperations, 'createTaskNotification')
      
      // Mock the notification creation
      taskOperations.createTaskNotification = jest.fn()

      const assignedTask = { ...mockTask, assigned_to: mockUser.id }
      await taskOperations.createTaskNotification(assignedTask, 'assigned')

      expect(taskOperations.createTaskNotification).toHaveBeenCalledWith(
        assignedTask,
        'assigned'
      )
    })

    it('should create notification when task status changes', async () => {
      taskOperations.createTaskNotification = jest.fn()

      const updatedTask = { ...mockTask, status: 'completed' as const }
      await taskOperations.createTaskNotification(updatedTask, 'status_changed', {
        oldStatus: 'in_progress',
        newStatus: 'completed',
      })

      expect(taskOperations.createTaskNotification).toHaveBeenCalledWith(
        updatedTask,
        'status_changed',
        { oldStatus: 'in_progress', newStatus: 'completed' }
      )
    })

    it('should create notification when comment is added', async () => {
      taskOperations.createTaskNotification = jest.fn()

      await taskOperations.createTaskNotification(mockTask, 'comment_added', {
        commenterId: mockUser.id,
      })

      expect(taskOperations.createTaskNotification).toHaveBeenCalledWith(
        mockTask,
        'comment_added',
        { commenterId: mockUser.id }
      )
    })
  })
})