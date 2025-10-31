import { taskOperations } from '../../lib/database'
import { supabase } from '../../lib/supabase'

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            or: jest.fn(),
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
      })),
    })),
    rpc: jest.fn(),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Task Operations', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    priority: 'medium' as const,
    status: 'pending' as const,
    assigned_to: 'user-1',
    created_by: 'user-admin',
    due_date: '2024-12-31T00:00:00Z',
    location: 'Test Location',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  const mockTaskWithRelations = {
    ...mockTask,
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTasks', () => {
    it('fetches all tasks when no userId provided', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [mockTaskWithRelations],
            error: null,
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await taskOperations.getTasks()

      expect(mockSupabase.from).toHaveBeenCalledWith('service_tasks')
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('assignee:assigned_to'))
      expect(result).toEqual([mockTaskWithRelations])
    })

    it('fetches user-specific tasks when userId provided', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            or: jest.fn(() => ({
              data: [mockTaskWithRelations],
              error: null,
            })),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await taskOperations.getTasks('user-1')

      expect(mockQuery.or).toHaveBeenCalledWith('assigned_to.eq.user-1,created_by.eq.user-1')
      expect(result).toEqual([mockTaskWithRelations])
    })

    it('handles fetch error gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: new Error('Database error'),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await taskOperations.getTasks()

      expect(result).toEqual([])
    })
  })

  describe('createTask', () => {
    const newTaskData = {
      title: 'New Task',
      description: 'New task description',
      priority: 'high' as const,
      assigned_to: 'user-1',
      created_by: 'user-admin',
    }

    it('creates task successfully', async () => {
      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockTaskWithRelations,
              error: null,
            })),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await taskOperations.createTask(newTaskData)

      expect(mockSupabase.from).toHaveBeenCalledWith('service_tasks')
      expect(mockQuery.insert).toHaveBeenCalledWith(newTaskData)
      expect(result).toEqual(mockTaskWithRelations)
    })

    it('handles creation error gracefully', async () => {
      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: new Error('Creation failed'),
            })),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await taskOperations.createTask(newTaskData)

      expect(result).toBeNull()
    })

    it('creates notification when task is assigned', async () => {
      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockTaskWithRelations,
              error: null,
            })),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      // Spy on createTaskNotification
      const createNotificationSpy = jest.spyOn(taskOperations, 'createTaskNotification')
      createNotificationSpy.mockResolvedValue()

      await taskOperations.createTask(newTaskData, true)

      expect(createNotificationSpy).toHaveBeenCalledWith(mockTaskWithRelations, 'assigned')
    })

    it('skips notification when notifyAssignee is false', async () => {
      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockTaskWithRelations,
              error: null,
            })),
          })),
        })),
      }
      
      mockSupabase.from.mockReturnValue(mockQuery as any)

      const createNotificationSpy = jest.spyOn(taskOperations, 'createTaskNotification')
      createNotificationSpy.mockResolvedValue()

      await taskOperations.createTask(newTaskData, false)

      expect(createNotificationSpy).not.toHaveBeenCalled()
    })
  })

  describe('updateTask', () => {
    const updateData = {
      status: 'in_progress' as const,
      assigned_to: 'user-2',
    }

    it('updates task successfully', async () => {
      // Mock getting current task
      const getCurrentTaskQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockTask,
              error: null,
            })),
          })),
        })),
      }

      // Mock updating task
      const updateQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { ...mockTaskWithRelations, ...updateData },
                error: null,
              })),
            })),
          })),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce(getCurrentTaskQuery as any)
        .mockReturnValueOnce(updateQuery as any)

      const result = await taskOperations.updateTask('task-1', updateData)

      expect(updateQuery.update).toHaveBeenCalledWith(updateData)
      expect(result).toEqual({ ...mockTaskWithRelations, ...updateData })
    })

    it('handles update error gracefully', async () => {
      const getCurrentTaskQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockTask,
              error: null,
            })),
          })),
        })),
      }

      const updateQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: new Error('Update failed'),
              })),
            })),
          })),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce(getCurrentTaskQuery as any)
        .mockReturnValueOnce(updateQuery as any)

      const result = await taskOperations.updateTask('task-1', updateData)

      expect(result).toBeNull()
    })

    it('creates notification for assignment change', async () => {
      const getCurrentTaskQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { ...mockTask, assigned_to: 'user-1' },
              error: null,
            })),
          })),
        })),
      }

      const updateQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { ...mockTaskWithRelations, assigned_to: 'user-2' },
                error: null,
              })),
            })),
          })),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce(getCurrentTaskQuery as any)
        .mockReturnValueOnce(updateQuery as any)

      const createNotificationSpy = jest.spyOn(taskOperations, 'createTaskNotification')
      createNotificationSpy.mockResolvedValue()

      await taskOperations.updateTask('task-1', { assigned_to: 'user-2' })

      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ assigned_to: 'user-2' }),
        'assigned'
      )
    })

    it('creates notification for status change', async () => {
      const getCurrentTaskQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { ...mockTask, status: 'pending' },
              error: null,
            })),
          })),
        })),
      }

      const updateQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { ...mockTaskWithRelations, status: 'completed' },
                error: null,
              })),
            })),
          })),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce(getCurrentTaskQuery as any)
        .mockReturnValueOnce(updateQuery as any)

      const createNotificationSpy = jest.spyOn(taskOperations, 'createTaskNotification')
      createNotificationSpy.mockResolvedValue()

      await taskOperations.updateTask('task-1', { status: 'completed' })

      expect(createNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' }),
        'status_changed',
        { oldStatus: 'pending', newStatus: 'completed' }
      )
    })
  })

  describe('createTaskNotification', () => {
    it('logs notification for assigned task', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await taskOperations.createTaskNotification(mockTaskWithRelations, 'assigned')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification created:',
        expect.objectContaining({
          title: 'New Task Assignment',
          message: 'You have been assigned to task: Test Task',
          targetUserId: 'user-1',
          taskId: 'task-1',
        })
      )

      consoleSpy.mockRestore()
    })

    it('logs notification for status change', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await taskOperations.createTaskNotification(
        mockTaskWithRelations,
        'status_changed',
        { oldStatus: 'pending', newStatus: 'completed' }
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification created:',
        expect.objectContaining({
          title: 'Task Status Updated',
          message: 'Task "Test Task" status changed from pending to completed',
          targetUserId: 'user-1',
        })
      )

      consoleSpy.mockRestore()
    })

    it('logs notification for comment added', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await taskOperations.createTaskNotification(
        mockTaskWithRelations,
        'comment_added',
        { commenterId: 'user-2' }
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification created:',
        expect.objectContaining({
          title: 'New Task Comment',
          message: 'New comment added to task: Test Task',
          targetUserId: 'user-1',
        })
      )

      consoleSpy.mockRestore()
    })

    it('handles notification creation error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Pass invalid task to trigger error
      await taskOperations.createTaskNotification(null as any, 'assigned')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating task notification:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getTaskStatistics', () => {
    it('fetches task statistics successfully', async () => {
      const mockStats = {
        total_tasks: 10,
        pending_tasks: 3,
        in_progress_tasks: 4,
        completed_tasks: 3,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: [mockStats],
        error: null,
      })

      const result = await taskOperations.getTaskStatistics('user-1')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_task_statistics', { user_id: 'user-1' })
      expect(result).toEqual(mockStats)
    })

    it('handles statistics fetch error gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failed'),
      })

      const result = await taskOperations.getTaskStatistics('user-1')

      expect(result).toBeNull()
    })

    it('fetches global statistics when no userId provided', async () => {
      const mockStats = {
        total_tasks: 50,
        pending_tasks: 15,
        in_progress_tasks: 20,
        completed_tasks: 15,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: [mockStats],
        error: null,
      })

      const result = await taskOperations.getTaskStatistics()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_task_statistics', { user_id: undefined })
      expect(result).toEqual(mockStats)
    })
  })
})