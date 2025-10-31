import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../../components/auth/login-form'
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the auth context
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

describe('LoginForm', () => {
  const mockSignIn = jest.fn()

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      user: null,
      profile: null,
      loading: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    jest.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates email field correctly', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Test invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates password field correctly', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Test short password
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')
    
    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message on sign in failure', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    mockSignIn.mockResolvedValue({ error: { message: errorMessage } })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: any) => void
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Check loading state
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    
    // Resolve the promise
    resolveSignIn!({ error: null })
  })

  it('renders sign up link when showSignUpLink is true', () => {
    const mockToggleMode = jest.fn()
    render(<LoginForm onToggleMode={mockToggleMode} showSignUpLink={true} />)
    
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('does not render sign up link when showSignUpLink is false', () => {
    render(<LoginForm showSignUpLink={false} />)
    
    expect(screen.queryByText("Don't have an account?")).not.toBeInTheDocument()
  })

  it('calls onToggleMode when sign up link is clicked', async () => {
    const user = userEvent.setup()
    const mockToggleMode = jest.fn()
    render(<LoginForm onToggleMode={mockToggleMode} />)
    
    const signUpLink = screen.getByRole('button', { name: /sign up/i })
    await user.click(signUpLink)
    
    expect(mockToggleMode).toHaveBeenCalled()
  })
})