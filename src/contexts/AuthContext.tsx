import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type UserRole = 'admin' | 'quality_control' | 'purchasing' | 'sale'

interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
}

// Create context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

// Create the provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Failed to fetch user profile:', error)
        // Instead of showing a toast, silently handle the error
        setUser(null)
        setLoading(false)
        return
      }

      if (data) {
        setUser(data)
      } else {
        // No user profile found
        setUser(null)
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        console.error('Authentication error:', authError)
        toast({
          title: 'Error',
          description: authError.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Wait for a moment to ensure the user is properly authenticated
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Fetch user profile, create if missing
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', authData.user?.id)
        .single()

      if (profile) {
        setUser(profile)
        toast({
          title: 'Success',
          description: 'Signed in successfully',
        })
      } else if (profileError) {
        // Profile doesn't exist, create it with default values
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || '',
            full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
            role: 'quality_control' // Default role
          })
          .select()
          .single()

        if (newProfile) {
          setUser(newProfile)
          toast({
            title: 'Success',
            description: 'Signed in successfully',
          })
        } else {
          console.error('Failed to create user profile:', createError)
          toast({
            title: 'Error',
            description: 'Failed to load user profile. Please try again.',
            variant: 'destructive',
          })
          setUser(null)
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })
      
      if (error) {
        console.error('Sign up error:', error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // The handle_new_user() trigger will automatically create the user profile
      // Just show success message
      if (data.user) {
        toast({
          title: 'Success',
          description: 'Account created successfully. Please check your email to confirm your account.',
        })
      }
    } catch (error: any) {
      console.error('Unexpected error during sign up:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Signed out successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getDashboardRoute = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'quality_control':
        return '/quality-control';
      case 'purchasing':
        return '/dashboard/purchasing';
      case 'sale':
        return '/sale';
      default:
        return '/auth';
    }
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Create and export the hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}