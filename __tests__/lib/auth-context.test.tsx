import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { profileOperations } from '../../lib/database'
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

// Mock dependencies
jest.mock('../../lib/supabase')
jest.mock('../../lib/database')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockProfileOperations = profileOperations as jest.Mocked<typeof profileOperations>

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: '2023-01-01T00:00:00Z',
    phone: '',
    confirmed_at: '2023-01-01T00:00:00Z',
    last_sign_in_at: '2023-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'technician' as const,
    status: 'active' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    
    mockProfileOperations.getProfile.mockResolvedValue(null)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.profile).toBe(null)
  })

  it('loads user and profile on initial session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    })
    mockProfileOperations.getProfile.mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
    expect(mockProfileOperations.getProfile).toHaveBeenCalledWith('user-123')
  })

  it('handles auth state changes', async () => {
    let authStateCallback: (event: string, session: any) => void

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    mockProfileOperations.getProfile.mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simulate sign in
    act(() => {
      authStateCallback('SIGNED_IN', { user: mockUser })
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })

    // Simulate sign out
    act(() => {
      authStateCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })
  })

  it('signs in user successfully', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signInResult: any
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password123')
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(signInResult.error).toBe(null)
  })

  it('handles sign in error', async () => {
    const signInError = new Error('Invalid credentials')
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: signInError,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signInResult: any
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
    })

    expect(signInResult.error).toBe(signInError)
  })

  it('signs up user successfully', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signUpResult: any
    await act(async () => {
      signUpResult = await result.current.signUp(
        'test@example.com',
        'password123',
        'Test User',
        'admin'
      )
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
          role: 'admin',
        },
      },
    })
    expect(signUpResult.error).toBe(null)
  })

  it('signs up user with default role when not specified', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', 'Test User')
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
          role: 'technician',
        },
      },
    })
  })

  it('handles sign up error', async () => {
    const signUpError = new Error('Email already exists')
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: signUpError,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signUpResult: any
    await act(async () => {
      signUpResult = await result.current.signUp(
        'existing@example.com',
        'password123',
        'Test User'
      )
    })

    expect(signUpResult.error).toBe(signUpError)
  })

  it('signs out user successfully', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('updates profile successfully', async () => {
    const updatedProfile = { ...mockProfile, full_name: 'Updated Name' }
    mockProfileOperations.updateProfile.mockResolvedValue(updatedProfile)

    // Set up initial state with user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    })
    mockProfileOperations.getProfile.mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
    })

    let updateResult: any
    await act(async () => {
      updateResult = await result.current.updateProfile({ full_name: 'Updated Name' })
    })

    expect(mockProfileOperations.updateProfile).toHaveBeenCalledWith('user-123', {
      full_name: 'Updated Name',
    })
    expect(updateResult).toEqual(updatedProfile)
    expect(result.current.profile).toEqual(updatedProfile)
  })

  it('returns null when updating profile without user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let updateResult: any
    await act(async () => {
      updateResult = await result.current.updateProfile({ full_name: 'Updated Name' })
    })

    expect(updateResult).toBe(null)
    expect(mockProfileOperations.updateProfile).not.toHaveBeenCalled()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})