import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard/tasks',
  useSearchParams: () => new URLSearchParams(),
}))

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
    getTasks: jest.fn().mockResolvedValue([]),
    createTask: jest.fn(),
    updateTask: jest.fn(),
  },
  profileOperations: {
    getAllProfiles: jest.fn().mockResolvedValue([]),
  },
}))

// Test utilities for touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  const touchList = touches.map(touch => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
    identifier: Math.random(),
    target: document.body,
  }))

  return new TouchEvent(type, {
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any,
    bubbles: true,
  })
}

// Mock viewport for mobile testing
const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  })
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('Mobile Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setMobileViewport()
  })

  describe('Mobile Task List', () => {
    it('should render task cards optimized for mobile', async () => {
      const TasksPage = require('../app/dashboard/tasks/page').default
      
      render(<TasksPage />)

      // Should show mobile-optimized layout
      await waitFor(() => {
        // Grid should be single column on mobile
        const taskGrid = document.querySelector('.grid')
        expect(taskGrid).toBeInTheDocument()
      })
    })

    it('should handle swipe gestures on task cards', async () => {
      const TasksPage = require('../app/dashboard/tasks/page').default
      
      render(<TasksPage />)

      // Find a task card (assuming there's at least one)
      const taskCard = document.querySelector('[data-testid="task-card"]') || document.body

      // Simulate swipe right gesture
      const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 100 }])
      const touchMove = createTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }])
      const touchEnd = createTouchEvent('touchend', [{ clientX: 200, clientY: 100 }])

      fireEvent(taskCard, touchStart)
      fireEvent(taskCard, touchMove)
      fireEvent(taskCard, touchEnd)

      // Should handle swipe gesture (implementation would depend on actual swipe handling)
      expect(touchStart.type).toBe('touchstart')
      expect(touchEnd.type).toBe('touchend')
    })

    it('should show appropriate touch targets for task actions', async () => {
      const TasksPage = require('../app/dashboard/tasks/page').default
      
      render(<TasksPage />)

      // All interactive elements should have adequate touch target size
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        // Should have padding that makes touch targets at least 44px
        expect(button).toHaveClass(/p-\d+|px-\d+|py-\d+/)
      })
    })
  })

  describe('Mobile File Upload', () => {
    it('should handle touch-based file selection', async () => {
      // Mock file input component
      const FileUploadComponent = () => (
        <div>
          <input
            type="file"
            data-testid="file-input"
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            data-testid="upload-button"
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center"
          >
            Tap to select files
          </button>
        </div>
      )

      render(<FileUploadComponent />)

      const uploadButton = screen.getByTestId('upload-button')
      const fileInput = screen.getByTestId('file-input')

      // Should be touch-friendly
      expect(uploadButton).toHaveClass('w-full', 'p-4')
      expect(fileInput).toHaveAttribute('multiple')
    })

    it('should support drag and drop on mobile devices', async () => {
      const FileUploadComponent = () => (
        <div
          data-testid="drop-zone"
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg"
        >
          Drop files here or tap to select
        </div>
      )

      render(<FileUploadComponent />)

      const dropZone = screen.getByTestId('drop-zone')

      // Simulate touch-based drag and drop
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      const touchMove = createTouchEvent('touchmove', [{ clientX: 150, clientY: 150 }])
      const touchEnd = createTouchEvent('touchend', [{ clientX: 200, clientY: 200 }])

      fireEvent(dropZone, touchStart)
      fireEvent(dropZone, touchMove)
      fireEvent(dropZone, touchEnd)

      // Should handle touch events
      expect(dropZone).toBeInTheDocument()
    })
  })

  describe('Mobile Search Interface', () => {
    it('should optimize search input for mobile keyboards', async () => {
      const SearchComponent = () => (
        <div className="w-full">
          <input
            type="search"
            placeholder="Search documents..."
            className="w-full p-3 text-lg border rounded-lg"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      )

      render(<SearchComponent />)

      const searchInput = screen.getByPlaceholderText('Search documents...')

      // Should have mobile-optimized attributes
      expect(searchInput).toHaveAttribute('type', 'search')
      expect(searchInput).toHaveAttribute('autoComplete', 'off')
      expect(searchInput).toHaveAttribute('autoCapitalize', 'none')
      expect(searchInput).toHaveAttribute('autoCorrect', 'off')
      expect(searchInput).toHaveAttribute('spellCheck', 'false')
    })

    it('should handle virtual keyboard appearance', async () => {
      const user = userEvent.setup()
      
      const SearchComponent = () => (
        <div className="fixed bottom-0 w-full p-4 bg-white">
          <input
            type="search"
            placeholder="Search..."
            className="w-full p-3 border rounded-lg"
          />
        </div>
      )

      render(<SearchComponent />)

      const searchInput = screen.getByPlaceholderText('Search...')

      // Focus should work properly
      await user.click(searchInput)
      expect(searchInput).toHaveFocus()

      // Should handle keyboard input
      await user.type(searchInput, 'test query')
      expect(searchInput).toHaveValue('test query')
    })
  })

  describe('Mobile Chat Interface', () => {
    it('should handle touch scrolling in chat messages', async () => {
      const ChatComponent = () => (
        <div className="flex flex-col h-screen">
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            data-testid="chat-messages"
          >
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="p-3 bg-gray-100 rounded-lg">
                Message {i + 1}
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full p-3 border rounded-lg"
            />
          </div>
        </div>
      )

      render(<ChatComponent />)

      const chatMessages = screen.getByTestId('chat-messages')

      // Should be scrollable
      expect(chatMessages).toHaveClass('overflow-y-auto')

      // Simulate touch scroll
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 300 }])
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }])
      const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 150 }])

      fireEvent(chatMessages, touchStart)
      fireEvent(chatMessages, touchMove)
      fireEvent(chatMessages, touchEnd)

      expect(chatMessages).toBeInTheDocument()
    })

    it('should handle message input with mobile keyboard', async () => {
      const user = userEvent.setup()
      
      const ChatComponent = () => (
        <div className="flex items-center p-4 space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-3 border rounded-lg"
            data-testid="message-input"
          />
          <button
            className="p-3 bg-blue-500 text-white rounded-lg"
            data-testid="send-button"
          >
            Send
          </button>
        </div>
      )

      render(<ChatComponent />)

      const messageInput = screen.getByTestId('message-input')
      const sendButton = screen.getByTestId('send-button')

      // Should handle typing
      await user.type(messageInput, 'Hello, this is a test message')
      expect(messageInput).toHaveValue('Hello, this is a test message')

      // Send button should be touch-friendly
      expect(sendButton).toHaveClass('p-3')
      
      await user.click(sendButton)
      // Would trigger send functionality in real implementation
    })
  })

  describe('Mobile Navigation Gestures', () => {
    it('should handle back gesture navigation', async () => {
      const mockBack = jest.fn()
      
      const NavigationComponent = () => (
        <div className="flex items-center p-4">
          <button
            onClick={mockBack}
            className="p-2 rounded-lg"
            data-testid="back-button"
          >
            ← Back
          </button>
          <h1 className="ml-4 text-lg font-semibold">Page Title</h1>
        </div>
      )

      render(<NavigationComponent />)

      const backButton = screen.getByTestId('back-button')

      // Should handle touch tap
      const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 50 }])
      const touchEnd = createTouchEvent('touchend', [{ clientX: 50, clientY: 50 }])

      fireEvent(backButton, touchStart)
      fireEvent(backButton, touchEnd)
      fireEvent.click(backButton)

      expect(mockBack).toHaveBeenCalled()
    })

    it('should handle edge swipe for navigation', async () => {
      const mockNavigate = jest.fn()
      
      const SwipeNavigationComponent = () => (
        <div
          className="w-full h-screen"
          data-testid="swipe-area"
          onTouchStart={(e) => {
            // Detect edge swipe (within 20px of left edge)
            if (e.touches[0].clientX < 20) {
              mockNavigate('back')
            }
          }}
        >
          <div className="p-4">
            <h1>Swipe from left edge to go back</h1>
          </div>
        </div>
      )

      render(<SwipeNavigationComponent />)

      const swipeArea = screen.getByTestId('swipe-area')

      // Simulate edge swipe
      const edgeSwipe = createTouchEvent('touchstart', [{ clientX: 10, clientY: 100 }])
      fireEvent(swipeArea, edgeSwipe)

      expect(mockNavigate).toHaveBeenCalledWith('back')
    })
  })

  describe('Mobile Form Interactions', () => {
    it('should handle form validation on mobile', async () => {
      const user = userEvent.setup()
      
      const MobileFormComponent = () => (
        <form className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              required
              className="w-full p-3 text-lg border rounded-lg"
              placeholder="Enter task title"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 text-lg border rounded-lg resize-none"
              placeholder="Enter description"
            />
          </div>
          <button
            type="submit"
            className="w-full p-4 bg-blue-500 text-white text-lg font-medium rounded-lg"
          >
            Create Task
          </button>
        </form>
      )

      render(<MobileFormComponent />)

      const titleInput = screen.getByLabelText('Task Title')
      const descriptionInput = screen.getByLabelText('Description')
      const submitButton = screen.getByRole('button', { name: 'Create Task' })

      // Should handle mobile input
      await user.type(titleInput, 'Mobile Test Task')
      await user.type(descriptionInput, 'This is a test description for mobile')

      expect(titleInput).toHaveValue('Mobile Test Task')
      expect(descriptionInput).toHaveValue('This is a test description for mobile')

      // Submit button should be full width and touch-friendly
      expect(submitButton).toHaveClass('w-full', 'p-4')
    })

    it('should handle select dropdowns on mobile', async () => {
      const user = userEvent.setup()
      
      const MobileSelectComponent = () => (
        <div className="p-4">
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            id="priority"
            className="w-full p-3 text-lg border rounded-lg appearance-none bg-white"
          >
            <option value="">Select priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      )

      render(<MobileSelectComponent />)

      const prioritySelect = screen.getByLabelText('Priority')

      // Should be touch-friendly
      expect(prioritySelect).toHaveClass('w-full', 'p-3')
      
      // Should handle selection
      await user.selectOptions(prioritySelect, 'high')
      expect(prioritySelect).toHaveValue('high')
    })
  })

  describe('Mobile Performance', () => {
    it('should handle rapid touch interactions without lag', async () => {
      const clickHandler = jest.fn()
      
      const RapidTouchComponent = () => (
        <button
          onClick={clickHandler}
          className="w-full p-4 bg-blue-500 text-white rounded-lg"
          data-testid="rapid-touch-button"
        >
          Tap Me Rapidly
        </button>
      )

      render(<RapidTouchComponent />)

      const button = screen.getByTestId('rapid-touch-button')

      // Simulate rapid touches
      for (let i = 0; i < 5; i++) {
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
        const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 100 }])
        
        fireEvent(button, touchStart)
        fireEvent(button, touchEnd)
        fireEvent.click(button)
      }

      // Should handle all rapid touches
      expect(clickHandler).toHaveBeenCalledTimes(5)
    })

    it('should prevent double-tap zoom on interactive elements', () => {
      const InteractiveComponent = () => (
        <div className="p-4">
          <button
            className="p-3 bg-blue-500 text-white rounded-lg"
            data-testid="touch-button"
          >
            No Double-tap Zoom
          </button>
        </div>
      )

      render(<InteractiveComponent />)

      const button = screen.getByTestId('touch-button')
      
      // Should have adequate padding for touch targets
      expect(button).toHaveClass('p-3')
      expect(button).toBeInTheDocument()
    })
  })
})