import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../components/auth/login-form'
import { SignupForm } from '../components/auth/signup-form'
import { RoleGuard, useRoleCheck } from '../components/auth/role-guard'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { renderHook } from '@testing-library/react'

// Mock dependencies
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  },
}))

jest.mock('../lib/database', () => ({
  profileOperations: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

// Mock useRouter
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
}))

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginForm Component', () => {
    it('renders login form elements', () => {
      render(<LoginForm />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('shows validation errors for invalid input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })
  })

  describe('SignupForm Component', () => {
    it('renders signup form elements', () => {
      render(<SignupForm />)
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // Should show validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('RoleGuard Component', () => {
    const TestComponent = () => <div>Protected Content</div>

    it('shows loading state when auth is loading', () => {
      const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
        const mockAuthValue = {
          user: null,
          profile: null,
          loading: true,
          signIn: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn(),
          updateProfile: jest.fn(),
        }
        
        return (
          <div>
            {React.cloneElement(children as React.ReactElement, { 
              ...mockAuthValue 
            })}
          </div>
        )
      }

      render(
        <MockAuthProvider>
          <RoleGuard allowedRoles={['admin']}>
            <TestComponent />
          </RoleGuard>
        </MockAuthProvider>
      )

      // Should show loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows authentication required when no user', () => {
      const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
        const mockAuthValue = {
          user: null,
          profile: null,
          loading: false,
          signIn: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn(),
          updateProfile: jest.fn(),
        }
        
        return (
          <div>
            {React.cloneElement(children as React.ReactElement, { 
              ...mockAuthValue 
            })}
          </div>
        )
      }

      render(
        <MockAuthProvider>
          <RoleGuard allowedRoles={['admin']}>
            <TestComponent />
          </RoleGuard>
        </MockAuthProvider>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    })
  })

  describe('AuthContext Integration', () => {
    it('provides authentication context to components', () => {
      const TestConsumer = () => {
        const { loading, user, profile } = useAuth()
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="user">{user ? 'has-user' : 'no-user'}</div>
            <div data-testid="profile">{profile ? 'has-profile' : 'no-profile'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      // Initially should be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })
  })

  describe('Role-based Access Control', () => {
    it('useRoleCheck hook returns correct role information', () => {
      const mockProfile = {
        id: '1',
        role: 'admin' as const,
        email: 'admin@test.com',
        full_name: 'Admin User',
        status: 'active' as const,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      }

      const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      // Mock the useAuth hook to return admin profile
      const mockUseAuth = jest.fn().mockReturnValue({
        user: { id: '1' },
        profile: mockProfile,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      })

      // Temporarily replace useAuth
      const originalUseAuth = require('../lib/auth-context').useAuth
      require('../lib/auth-context').useAuth = mockUseAuth

      const { result } = renderHook(() => useRoleCheck(), { 
        wrapper: MockAuthProvider 
      })

      expect(result.current.currentRole).toBe('admin')
      expect(result.current.isAdmin()).toBe(true)
      expect(result.current.hasRole('admin')).toBe(true)
      expect(result.current.hasRole(['admin', 'supervisor'])).toBe(true)

      // Restore original useAuth
      require('../lib/auth-context').useAuth = originalUseAuth
    })
  })
})