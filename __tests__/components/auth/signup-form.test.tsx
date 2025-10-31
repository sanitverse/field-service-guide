import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../../../components/auth/signup-form'
import { useAuth } from '../../../lib/auth-context'
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
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the auth context
jest.mock('../../../lib/auth-context')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('SignupForm', () => {
  const mockSignUp = jest.fn()

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      user: null,
      profile: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    jest.clearAllMocks()
  })

  it('renders signup form with all required fields', () => {
    render(<SignupForm />)
    
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates full name field correctly', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Test short name
    await user.type(nameInput, 'A')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('validates email field correctly', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Test invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates password field correctly', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Test short password
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('validates password confirmation correctly', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Test mismatched passwords
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'differentpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const passwordInput = screen.getByPlaceholderText('Create a password') as HTMLInputElement
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password') as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { name: '' }) // Eye icon buttons
    
    // Initially passwords should be hidden
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')
    
    // Click to show first password
    await user.click(toggleButtons[0])
    expect(passwordInput.type).toBe('text')
    
    // Click to show second password
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput.type).toBe('text')
  })

  it('submits form with valid data and default role', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<SignupForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John Doe',
        'technician'
      )
    })
  })

  it('submits form with custom default role', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<SignupForm defaultRole="admin" />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(nameInput, 'Admin User')
    await user.type(emailInput, 'admin@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'admin@example.com',
        'password123',
        'Admin User',
        'admin'
      )
    })
  })

  it('displays success message on successful signup', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<SignupForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/account created successfully/i)).toBeInTheDocument()
    })
  })

  it('displays error message on signup failure', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already exists'
    mockSignUp.mockResolvedValue({ error: { message: errorMessage } })
    
    render(<SignupForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByPlaceholderText('Create a password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('renders sign in link when showSignInLink is true', () => {
    const mockToggleMode = jest.fn()
    render(<SignupForm onToggleMode={mockToggleMode} showSignInLink={true} />)
    
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('does not render sign in link when showSignInLink is false', () => {
    render(<SignupForm showSignInLink={false} />)
    
    expect(screen.queryByText('Already have an account?')).not.toBeInTheDocument()
  })

  it('calls onToggleMode when sign in link is clicked', async () => {
    const user = userEvent.setup()
    const mockToggleMode = jest.fn()
    render(<SignupForm onToggleMode={mockToggleMode} />)
    
    const signInLink = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInLink)
    
    expect(mockToggleMode).toHaveBeenCalled()
  })
})