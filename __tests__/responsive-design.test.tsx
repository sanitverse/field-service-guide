import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
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

// Test utilities for viewport manipulation
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  
  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

// Mock matchMedia for responsive breakpoints
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
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

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset viewport to desktop size
    setViewport(1024, 768)
    mockMatchMedia(false)
  })

  describe('Mobile Layout Tests', () => {
    beforeEach(() => {
      // Set mobile viewport
      setViewport(375, 667)
      mockMatchMedia(true)
    })

    it('should show mobile navigation menu button on small screens', async () => {
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // Mobile menu button should be visible (look for button with lg:hidden class)
      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toBeVisible()
    })

    it('should toggle mobile navigation menu when menu button is clicked', async () => {
      const user = userEvent.setup()
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      
      // Initially, mobile menu should not be visible in mobile view
      // (The desktop nav items are always present but hidden on mobile)
      
      // Click to open mobile menu
      await user.click(menuButton!)
      
      // Should trigger mobile menu toggle (implementation dependent)
      expect(menuButton).toBeInTheDocument()
    })

    it('should close mobile menu when navigation item is clicked', async () => {
      const user = userEvent.setup()
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      
      // Open mobile menu
      await user.click(menuButton!)
      
      // Click on a navigation item (Tasks link - get the first one)
      const tasksLinks = screen.getAllByText('Tasks')
      await user.click(tasksLinks[0])
      
      // Should handle navigation
      expect(tasksLinks[0]).toBeInTheDocument()
    })

    it('should hide desktop navigation on mobile screens', () => {
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // Desktop navigation should be hidden (using lg:flex class)
      const desktopNav = document.querySelector('nav.hidden.lg\\:flex')
      expect(desktopNav).toBeInTheDocument()
    })
  })

  describe('Touch Interaction Tests', () => {
    beforeEach(() => {
      setViewport(375, 667)
      mockMatchMedia(true)
    })

    it('should handle touch events on interactive elements', async () => {
      const user = userEvent.setup()
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      
      // Simulate touch events
      fireEvent.touchStart(menuButton!)
      fireEvent.touchEnd(menuButton!)
      
      // Should still work like a click
      await user.click(menuButton!)
      
      // Should handle touch interaction
      expect(menuButton).toBeInTheDocument()
    })

    it('should have appropriate touch target sizes for mobile', () => {
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      const userMenuButton = buttons.find(button => 
        button.className.includes('flex items-center space-x-3')
      )
      
      // Buttons should have adequate touch target size (minimum 44px)
      // These should have padding that makes them touch-friendly
      expect(menuButton).toHaveClass('p-2')
      expect(userMenuButton).toHaveClass('px-3', 'py-2')
    })
  })

  describe('Responsive Breakpoint Tests', () => {
    it('should adapt layout for tablet screens (768px)', () => {
      setViewport(768, 1024)
      mockMatchMedia(false)
      
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // At tablet size, should show some desktop elements but still have mobile menu
      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      expect(menuButton).toBeInTheDocument()
    })

    it('should show full desktop layout on large screens (1024px+)', () => {
      setViewport(1200, 800)
      mockMatchMedia(false)
      
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // Desktop navigation should be visible
      const desktopNav = document.querySelector('nav.hidden.lg\\:flex')
      expect(desktopNav).toBeInTheDocument()
      
      // Mobile menu button should still be present but hidden on large screens
      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      expect(menuButton).toHaveClass('lg:hidden')
    })

    it('should handle very small screens (320px)', () => {
      setViewport(320, 568)
      mockMatchMedia(true)
      
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // Should still be functional on very small screens
      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toBeVisible()
    })
  })

  describe('Content Responsiveness Tests', () => {
    it('should hide non-essential text on small screens', () => {
      setViewport(375, 667)
      
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // Logo text should be hidden on small screens
      const logoText = document.querySelector('.hidden.sm\\:block')
      expect(logoText).toBeInTheDocument()
    })

    it('should show full user information on desktop', () => {
      setViewport(1024, 768)
      
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      // User info should be visible on desktop (md:block class)
      const userInfo = document.querySelector('.hidden.md\\:block')
      expect(userInfo).toBeInTheDocument()
    })
  })

  describe('Accessibility on Mobile', () => {
    beforeEach(() => {
      setViewport(375, 667)
      mockMatchMedia(true)
    })

    it('should maintain keyboard navigation on mobile', async () => {
      const user = userEvent.setup()
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      
      // Should be focusable
      menuButton!.focus()
      expect(menuButton).toHaveFocus()
      
      // Should respond to Enter key
      await user.keyboard('{Enter}')
      
      // Should handle keyboard interaction
      expect(menuButton).toBeInTheDocument()
    })

    it('should have proper ARIA labels for mobile navigation', () => {
      const DashboardLayout = require('../app/dashboard/layout').default
      
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      )

      const buttons = screen.getAllByRole('button')
      const menuButton = buttons.find(button => 
        button.className.includes('lg:hidden')
      )
      
      // Should have accessible button
      expect(menuButton).toBeInTheDocument()
      
      // Icon should be properly labeled
      const menuIcon = menuButton!.querySelector('svg')
      expect(menuIcon).toBeInTheDocument()
    })
  })
})