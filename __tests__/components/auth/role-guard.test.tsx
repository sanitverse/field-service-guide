import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleGuard, withRoleGuard, useRoleCheck } from '../../../components/auth/role-guard'
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { renderHook } from '@testing-library/react'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { describe } from 'node:test'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { describe } from 'node:test'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the auth context and router
jest.mock('../../../lib/auth-context')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

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

describe('RoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: true,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleGuard>
    )

    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows authentication required message when user is not signed in', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: false,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleGuard>
    )

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('You must be signed in to access this content.')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows access denied message when user role is not allowed', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin', 'supervisor']}>
        <div>Protected Content</div>
      </RoleGuard>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/Required roles: admin, supervisor/)).toBeInTheDocument()
    expect(screen.getByText(/Your role: technician/)).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'admin', email: 'admin@example.com', full_name: 'Admin User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin', 'supervisor']}>
        <div>Protected Content</div>
      </RoleGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('renders fallback component when provided and access is denied', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard 
        allowedRoles={['admin']} 
        fallback={<div>Custom Fallback</div>}
      >
        <div>Protected Content</div>
      </RoleGuard>
    )

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('navigates to custom redirect path when Go Back button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin']} redirectTo="/custom-path">
        <div>Protected Content</div>
      </RoleGuard>
    )

    const goBackButton = screen.getByRole('button', { name: /go back/i })
    await user.click(goBackButton)

    expect(mockPush).toHaveBeenCalledWith('/custom-path')
  })

  it('navigates to default dashboard when Go Back button is clicked without custom redirect', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleGuard>
    )

    const goBackButton = screen.getByRole('button', { name: /go back/i })
    await user.click(goBackButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})

describe('withRoleGuard HOC', () => {
  const TestComponent = ({ message }: { message: string }) => <div>{message}</div>
  const ProtectedComponent = withRoleGuard(TestComponent, ['admin'])

  it('renders wrapped component when user has required role', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'admin', email: 'admin@example.com', full_name: 'Admin User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<ProtectedComponent message="Hello Admin" />)

    expect(screen.getByText('Hello Admin')).toBeInTheDocument()
  })

  it('shows access denied when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<ProtectedComponent message="Hello Admin" />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Hello Admin')).not.toBeInTheDocument()
  })
})

describe('useRoleCheck hook', () => {
  const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  it('returns correct role check functions for admin user', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'admin', email: 'admin@example.com', full_name: 'Admin User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    const { result } = renderHook(() => useRoleCheck(), { wrapper: AuthWrapper })

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole(['admin', 'supervisor'])).toBe(true)
    expect(result.current.hasRole('technician')).toBe(false)
    expect(result.current.isAdmin()).toBe(true)
    expect(result.current.isSupervisor()).toBe(true)
    expect(result.current.isTechnician()).toBe(true)
    expect(result.current.isCustomer()).toBe(false)
    expect(result.current.currentRole).toBe('admin')
  })

  it('returns correct role check functions for technician user', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: '1', role: 'technician', email: 'tech@example.com', full_name: 'Tech User', status: 'active', created_at: '', updated_at: '' },
      loading: false,
      user: { id: '1' } as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    const { result } = renderHook(() => useRoleCheck(), { wrapper: AuthWrapper })

    expect(result.current.hasRole('technician')).toBe(true)
    expect(result.current.hasRole(['admin', 'supervisor'])).toBe(false)
    expect(result.current.hasRole('admin')).toBe(false)
    expect(result.current.isAdmin()).toBe(false)
    expect(result.current.isSupervisor()).toBe(false)
    expect(result.current.isTechnician()).toBe(true)
    expect(result.current.isCustomer()).toBe(false)
    expect(result.current.currentRole).toBe('technician')
  })

  it('returns false for all role checks when no profile exists', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: false,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    const { result } = renderHook(() => useRoleCheck(), { wrapper: AuthWrapper })

    expect(result.current.hasRole('admin')).toBe(false)
    expect(result.current.hasRole(['admin', 'supervisor'])).toBe(false)
    expect(result.current.isAdmin()).toBe(false)
    expect(result.current.isSupervisor()).toBe(false)
    expect(result.current.isTechnician()).toBe(false)
    expect(result.current.isCustomer()).toBe(false)
    expect(result.current.currentRole).toBe(null)
  })
})