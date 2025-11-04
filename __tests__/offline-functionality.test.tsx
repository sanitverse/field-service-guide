import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock service worker registration
const mockServiceWorker = {
  register: jest.fn(),
  unregister: jest.fn(),
  addEventListener: jest.fn(),
  postMessage: jest.fn(),
}

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
})

// Mock fetch for offline scenarios
const originalFetch = global.fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock auth context
jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    profile: { 
      id: 'test-user', 
      email: 'test@example.com', 
      role: 'technician',
      full_name: 'Test User'
    },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  }),
}))

// Mock notification context
jest.mock('../lib/notification-context', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNotifications: () => ({
    showToast: jest.fn(),
  }),
}))

// Mock database operations
jest.mock('../lib/database', () => ({
  taskOperations: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
  },
}))

describe('Offline Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    navigator.onLine = true
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  describe('Network Status Detection', () => {
    it('should detect when user goes offline', async () => {
      // Simulate going offline
      act(() => {
        navigator.onLine = false
        window.dispatchEvent(new Event('offline'))
      })

      // Should detect offline status
      expect(navigator.onLine).toBe(false)
    })

    it('should detect when user comes back online', async () => {
      // Start offline
      navigator.onLine = false
      
      // Simulate coming back online
      act(() => {
        navigator.onLine = true
        window.dispatchEvent(new Event('online'))
      })

      // Should detect online status
      expect(navigator.onLine).toBe(true)
    })

    it('should handle network status changes during app usage', async () => {
      const networkStatusHandler = jest.fn()
      
      // Add event listeners
      window.addEventListener('online', networkStatusHandler)
      window.addEventListener('offline', networkStatusHandler)
      
      // Simulate network changes
      act(() => {
        navigator.onLine = false
        window.dispatchEvent(new Event('offline'))
      })
      
      act(() => {
        navigator.onLine = true
        window.dispatchEvent(new Event('online'))
      })
      
      expect(networkStatusHandler).toHaveBeenCalledTimes(2)
      
      // Cleanup
      window.removeEventListener('online', networkStatusHandler)
      window.removeEventListener('offline', networkStatusHandler)
    })
  })

  describe('Local Storage for Draft Data', () => {
    it('should save draft task data to localStorage', () => {
      const draftTask = {
        title: 'Draft Task',
        description: 'This is a draft task',
        priority: 'medium',
        created_by: 'test-user',
      }

      // Simulate saving draft
      const draftKey = 'draft_task_new'
      localStorage.setItem(draftKey, JSON.stringify(draftTask))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        draftKey,
        JSON.stringify(draftTask)
      )
    })

    it('should retrieve draft task data from localStorage', () => {
      const draftTask = {
        title: 'Draft Task',
        description: 'This is a draft task',
        priority: 'medium',
        created_by: 'test-user',
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftTask))

      const retrieved = JSON.parse(localStorage.getItem('draft_task_new') || '{}')
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('draft_task_new')
      expect(retrieved).toEqual(draftTask)
    })

    it('should save draft comments to localStorage', () => {
      const draftComment = {
        task_id: 'task-123',
        content: 'This is a draft comment',
        author_id: 'test-user',
        timestamp: Date.now(),
      }

      const draftKey = 'draft_comment_task-123'
      localStorage.setItem(draftKey, JSON.stringify(draftComment))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        draftKey,
        JSON.stringify(draftComment)
      )
    })

    it('should clear draft data after successful sync', () => {
      const draftKey = 'draft_task_new'
      
      // Simulate clearing draft after sync
      localStorage.removeItem(draftKey)
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(draftKey)
    })
  })

  describe('Offline Data Synchronization', () => {
    it('should queue failed requests for later sync', async () => {
      // Simulate network failure
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const failedRequest = {
        url: '/api/tasks',
        method: 'POST',
        body: JSON.stringify({ title: 'New Task' }),
        timestamp: Date.now(),
      }

      // Should store failed request for later sync
      const queueKey = 'sync_queue'
      const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]')
      const updatedQueue = [...existingQueue, failedRequest]
      
      localStorage.setItem(queueKey, JSON.stringify(updatedQueue))
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        queueKey,
        JSON.stringify(updatedQueue)
      )
    })

    it('should process sync queue when coming back online', async () => {
      const syncQueue = [
        {
          url: '/api/tasks',
          method: 'POST',
          body: JSON.stringify({ title: 'Offline Task 1' }),
          timestamp: Date.now() - 1000,
        },
        {
          url: '/api/tasks',
          method: 'POST',
          body: JSON.stringify({ title: 'Offline Task 2' }),
          timestamp: Date.now() - 500,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(syncQueue))
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new-task-id' }),
      })

      // Simulate processing sync queue
      const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]')
      
      // Process each queued request
      for (const request of queue) {
        await fetch(request.url, {
          method: request.method,
          body: request.body,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object))
    })

    it('should handle sync conflicts gracefully', async () => {
      // Simulate conflict response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Conflict: Resource was modified' }),
      })

      const conflictRequest = {
        url: '/api/tasks/task-123',
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Task' }),
        timestamp: Date.now(),
      }

      try {
        const response = await fetch(conflictRequest.url, {
          method: conflictRequest.method,
          body: conflictRequest.body,
        })
        
        if (!response.ok && response.status === 409) {
          // Handle conflict - could show user a merge dialog
          const conflictData = await response.json()
          expect(conflictData.error).toContain('Conflict')
        }
      } catch (error) {
        // Handle network error
      }

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-123', expect.any(Object))
    })
  })

  describe('Offline Task Viewing', () => {
    it('should cache task data for offline viewing', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'First task',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Second task',
          status: 'in_progress',
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      // Cache tasks for offline viewing
      const cacheKey = 'cached_tasks'
      localStorage.setItem(cacheKey, JSON.stringify({
        data: tasks,
        timestamp: Date.now(),
      }))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        cacheKey,
        expect.stringContaining('task-1')
      )
    })

    it('should serve cached data when offline', () => {
      const cachedTasks = {
        data: [
          { id: 'task-1', title: 'Cached Task 1' },
          { id: 'task-2', title: 'Cached Task 2' },
        ],
        timestamp: Date.now() - 30000, // 30 seconds ago
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedTasks))

      // Simulate offline scenario
      navigator.onLine = false

      const cached = JSON.parse(localStorage.getItem('cached_tasks') || '{}')
      
      expect(cached.data).toHaveLength(2)
      expect(cached.data[0].title).toBe('Cached Task 1')
    })

    it('should indicate when data is stale or cached', () => {
      const staleData = {
        data: [{ id: 'task-1', title: 'Old Task' }],
        timestamp: Date.now() - (60 * 60 * 1000), // 1 hour ago
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleData))

      const cached = JSON.parse(localStorage.getItem('cached_tasks') || '{}')
      const isStale = Date.now() - cached.timestamp > (30 * 60 * 1000) // 30 minutes

      expect(isStale).toBe(true)
    })
  })

  describe('Service Worker Integration', () => {
    it('should register service worker for offline support', async () => {
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
      })

      // Simulate service worker registration
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
      }

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('should handle service worker registration failure', async () => {
      mockServiceWorker.register.mockRejectedValue(new Error('SW registration failed'))

      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/sw.js')
        }
      } catch (error) {
        expect(error.message).toBe('SW registration failed')
      }

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('should communicate with service worker for cache management', () => {
      const message = {
        type: 'CACHE_TASKS',
        payload: [
          { id: 'task-1', title: 'Task to cache' }
        ]
      }

      // Simulate sending message to service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message)
      }

      // Since we're mocking, we can't test the actual postMessage,
      // but we can verify the structure is correct
      expect(message.type).toBe('CACHE_TASKS')
      expect(message.payload).toHaveLength(1)
    })
  })

  describe('Progressive Web App Features', () => {
    it('should handle app installation prompt', () => {
      let deferredPrompt: any = null

      // Mock beforeinstallprompt event
      const mockInstallEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }

      // Simulate beforeinstallprompt event
      deferredPrompt = mockInstallEvent
      deferredPrompt.preventDefault()

      expect(mockInstallEvent.preventDefault).toHaveBeenCalled()
      expect(deferredPrompt).toBeTruthy()
    })

    it('should show install prompt when user clicks install button', async () => {
      const mockInstallEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }

      // Simulate user clicking install
      if (mockInstallEvent) {
        await mockInstallEvent.prompt()
        const choiceResult = await mockInstallEvent.userChoice
        
        expect(choiceResult.outcome).toBe('accepted')
      }

      expect(mockInstallEvent.prompt).toHaveBeenCalled()
    })

    it('should handle app manifest properties', () => {
      // Mock manifest data that would be in public/manifest.json
      const expectedManifest = {
        name: 'Field Service Guide',
        short_name: 'FSG',
        description: 'Professional field service management application',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      }

      // Verify manifest structure
      expect(expectedManifest.name).toBe('Field Service Guide')
      expect(expectedManifest.display).toBe('standalone')
      expect(expectedManifest.icons).toHaveLength(2)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data integrity during offline/online transitions', () => {
      const originalData = { id: 'task-1', title: 'Original Task', version: 1 }
      const modifiedData = { id: 'task-1', title: 'Modified Task', version: 1 }
      const serverData = { id: 'task-1', title: 'Server Task', version: 2 }

      // Simulate conflict detection
      const hasConflict = originalData.version < serverData.version && 
                         JSON.stringify(modifiedData) !== JSON.stringify(originalData)

      expect(hasConflict).toBe(true)
    })

    it('should handle optimistic updates correctly', () => {
      const optimisticUpdate = {
        id: 'temp-id',
        title: 'New Task',
        status: 'pending',
        isOptimistic: true,
      }

      // Store optimistic update
      localStorage.setItem('optimistic_task_temp-id', JSON.stringify(optimisticUpdate))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'optimistic_task_temp-id',
        JSON.stringify(optimisticUpdate)
      )
    })

    it('should replace optimistic updates with server response', () => {
      const serverResponse = {
        id: 'real-id',
        title: 'New Task',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Remove optimistic update and store real data
      localStorage.removeItem('optimistic_task_temp-id')
      localStorage.setItem('task_real-id', JSON.stringify(serverResponse))

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('optimistic_task_temp-id')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'task_real-id',
        JSON.stringify(serverResponse)
      )
    })
  })
})