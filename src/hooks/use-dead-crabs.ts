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

      setLoading(true)
      
      // Format the time to ensure it matches PostgreSQL time format
      const formattedTime = data.time + ':00' // Add seconds if not present

      const { error } = await supabase
        .from('dead_crabs')
        .insert({
          box_number: data.box_number,
          category: data.category as 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo',
          weight_kg: data.weight_kg,
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
        description: error.message || 'Failed to record dead crab entry',
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