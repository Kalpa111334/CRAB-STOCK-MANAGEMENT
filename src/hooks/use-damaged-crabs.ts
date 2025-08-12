import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface DamagedCrabEntry {
  id: string
  date: string
  time: string
  box_number: string
  category: string
  weight_kg: number
  damage_type: string
  damage_description?: string
  action_taken?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface AddDamagedCrabData {
  box_number: string
  category: string
  weight_kg: number
  time: string
  damage_type: string
  damage_description?: string
  action_taken?: string
  notes?: string
}

export const useDamagedCrabs = () => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<DamagedCrabEntry[]>([])
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

  // Fetch damaged crabs when component mounts
  useEffect(() => {
    fetchDamagedCrabs()
  }, [])

  const fetchDamagedCrabs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('damaged_crabs')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching damaged crabs:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch damaged crab entries',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addDamagedCrab = async (data: AddDamagedCrabData) => {
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
        throw new Error('You do not have permission to record damaged crabs. Only quality control and admin users can perform this action.')
      }

      setLoading(true)
      
      // First, try to verify the table structure exists
      const { error: schemaError } = await supabase
        .from('damaged_crabs')
        .select('damage_type')
        .limit(1)
      
      if (schemaError && schemaError.message.includes('damage_type')) {
        console.error('Schema error:', schemaError)
        // Try to refresh the schema by making a simple query
        try {
          await supabase.from('damaged_crabs').select('*').limit(0)
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
        .from('damaged_crabs')
        .insert({
          box_number: data.box_number,
          category: data.category as 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo',
          weight_kg: parseFloat(data.weight_kg.toString()),
          time: formattedTime,
          damage_type: data.damage_type,
          damage_description: data.damage_description,
          action_taken: data.action_taken,
          notes: data.notes,
          created_by: user.id
        })

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '42501') {
          throw new Error('You do not have permission to record damaged crabs')
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
        description: 'Damaged crab entry recorded successfully',
      })

      // Refresh the entries
      await fetchDamagedCrabs()
    } catch (error: any) {
      console.error('Error adding damaged crab:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to record damaged crab',
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
    fetchDamagedCrabs,
    addDamagedCrab,
  }
}
