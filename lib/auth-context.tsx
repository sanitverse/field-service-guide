'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { profileOperations } from './database'
import type { Profile } from './supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const userProfile = await profileOperations.getOrCreateProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.full_name,
              session.user.user_metadata?.role
            )
            
            if (userProfile) {
              setProfile(userProfile)
              console.log('Profile loaded successfully:', userProfile.email)
            } else {
              // If getOrCreateProfile returns null, create a fallback
              console.warn('getOrCreateProfile returned null, creating fallback profile')
              const fallbackProfile = profileOperations.createMockProfile(
                session.user.id,
                session.user.email || '',
                session.user.user_metadata?.full_name,
                session.user.user_metadata?.role || 'technician'
              )
              setProfile(fallbackProfile)
            }
          } catch (profileError) {
            console.warn('Profile creation issue, using fallback profile:', profileError)
            // Create a fallback profile so the app can still work
            const fallbackProfile = profileOperations.createMockProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.full_name,
              session.user.user_metadata?.role || 'technician'
            )
            setProfile(fallbackProfile)
            console.log('Fallback profile created:', fallbackProfile.email)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Unexpected error in getInitialSession:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        try {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            try {
              const userProfile = await profileOperations.getOrCreateProfile(
                session.user.id,
                session.user.email || '',
                session.user.user_metadata?.full_name,
                session.user.user_metadata?.role
              )
              
              if (userProfile) {
                setProfile(userProfile)
                console.log('Profile loaded in auth change:', userProfile.email)
              } else {
                // If getOrCreateProfile returns null, create a fallback
                console.warn('getOrCreateProfile returned null in auth change, creating fallback profile')
                const fallbackProfile = profileOperations.createMockProfile(
                  session.user.id,
                  session.user.email || '',
                  session.user.user_metadata?.full_name,
                  session.user.user_metadata?.role || 'technician'
                )
                setProfile(fallbackProfile)
              }
            } catch (profileError) {
              console.warn('Profile creation issue in auth change, using fallback profile:', profileError)
              const fallbackProfile = profileOperations.createMockProfile(
                session.user.id,
                session.user.email || '',
                session.user.user_metadata?.full_name,
                session.user.user_metadata?.role || 'technician'
              )
              setProfile(fallbackProfile)
              console.log('Fallback profile created in auth change:', fallbackProfile.email)
            }
          } else {
            setProfile(null)
          }
          
          setLoading(false)
        } catch (error) {
          console.error('Unexpected error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string = 'technician') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setProfile(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
      }
      
      // Force redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      // Force redirect even if there's an error
      window.location.href = '/'
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return null
    
    const updatedProfile = await profileOperations.updateProfile(user.id, updates)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
    
    return updatedProfile
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}