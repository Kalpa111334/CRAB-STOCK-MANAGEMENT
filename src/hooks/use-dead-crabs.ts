import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface DeadCrabEntry {
  id: string
  date: string
  time: string
  box_number: string
  category: string
  weight_kg: number
  cause_of_death: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface AddDeadCrabData {
  box_number: string
  category: string
  weight_kg: number
  time: string
  cause_of_death: string
  notes?: string
}

export const useDeadCrabs = () => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<DeadCrabEntry[]>([])
  const { toast } = useToast()

  // Get current user session
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch dead crabs when component mounts
  useEffect(() => {
    fetchDeadCrabs()
  }, []) // Empty dependency array means this runs once on mount

  const fetchDeadCrabs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dead_crabs')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching dead crabs:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch dead crab entries',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addDeadCrab = async (data: AddDeadCrabData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Check user role before attempting to insert
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user profile:', userError)
        // Try to get user info from auth context as fallback
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          throw new Error('Unable to verify user permissions')
        }
        // Continue with the insert attempt - RLS will handle the permission check
      } else if (!userProfile || !['quality_control', 'admin'].includes(userProfile.role)) {
        throw new Error('You do not have permission to record dead crabs. Only quality control and admin users can perform this action.')
      }

      setLoading(true)
      
      // First, try to verify the table structure exists
      const { error: schemaError } = await supabase
        .from('dead_crabs')
        .select('category')
        .limit(1)
      
      if (schemaError && schemaError.message.includes('category')) {
        console.error('Schema error:', schemaError)
        // Try to refresh the schema by making a simple query
        try {
          await supabase.from('dead_crabs').select('*').limit(0)
        } catch (refreshError) {
          throw new Error('Database schema is not properly set up. Please contact an administrator.')
        }
      }
      
      // Format the time to ensure it matches PostgreSQL time format
      let formattedTime = data.time
      if (!formattedTime.includes(':')) {
        formattedTime = formattedTime + ':00'
      } else if (formattedTime.split(':').length === 2) {
        formattedTime = formattedTime + ':00'
      }

      // Validate weight
      if (isNaN(data.weight_kg) || data.weight_kg <= 0) {
        throw new Error('Weight must be a positive number')
      }

      const { error } = await supabase
        .from('dead_crabs')
        .insert({
          box_number: data.box_number,
          category: data.category as 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo',
          weight_kg: parseFloat(data.weight_kg.toString()),
          time: formattedTime,
          cause_of_death: data.cause_of_death,
          notes: data.notes,
          created_by: user.id // Add the user ID
        })

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '42501') {
          throw new Error('You do not have permission to record dead crabs')
        } else if (error.code === '23502') {
          throw new Error('Missing required fields')
        } else if (error.code === '23503') {
          throw new Error('Invalid user reference')
        } else {
          throw new Error(error.message)
        }
      }

      toast({
        title: 'Success',
        description: 'Dead crab entry recorded successfully',
      })

      // Refresh the entries
      await fetchDeadCrabs()
    } catch (error: any) {
      console.error('Error adding dead crab:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to record dead crab',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    entries,
    fetchDeadCrabs,
    addDeadCrab,
  }
} 