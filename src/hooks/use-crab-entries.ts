import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface CrabEntry {
  id: string
  date: string
  supplier: string
  box_number: string
  weight_kg: number
  category: 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'
  male_count: number
  female_count: number
  crab_status: ('Without one claw' | 'Without two claw' | 'Without one leg' | 'Without two leg' | 'Without three legs' | 'Without four legs' | 'Shell damage')[] | null
  health_status: 'healthy' | 'damaged'
  damaged_details?: string
  report_type: 'TSF' | 'Dutch_Trails'
  created_by: string
  created_at: string
  updated_at: string
}

export function useCrabEntries() {
  const [entries, setEntries] = useState<CrabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('crab_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setEntries(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch crab entries',
        variant: 'destructive',
      })
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEntry = async (entry: Omit<CrabEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ensure date and weight are properly formatted
      const formattedEntry = {
        ...entry,
        date: entry.date, // Keep the selected date as is
        weight_kg: parseFloat(entry.weight_kg.toString()) // Store exact weight value
      }
      
      const { data, error } = await supabase
        .from('crab_entries')
        .insert(formattedEntry)
        .select()
        .single()

      if (error) throw error

      setEntries(prev => [data, ...prev])
      toast({
        title: 'Success',
        description: 'Crab entry added successfully',
      })
      return data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add crab entry',
        variant: 'destructive',
      })
      throw error
    }
  }

  const updateEntry = async (id: string, updates: Partial<Omit<CrabEntry, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('crab_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setEntries(prev => prev.map(entry => entry.id === id ? data : entry))
      toast({
        title: 'Success',
        description: 'Crab entry updated successfully',
      })
      return data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update crab entry',
        variant: 'destructive',
      })
      throw error
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crab_entries')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.id !== id))
      toast({
        title: 'Success',
        description: 'Crab entry deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete crab entry',
        variant: 'destructive',
      })
      throw error
    }
  }

  const deleteEntryByBoxNumber = async (boxNumber: string) => {
    try {
      const { error } = await supabase
        .from('crab_entries')
        .delete()
        .eq('box_number', boxNumber)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.box_number !== boxNumber))
      toast({
        title: 'Success',
        description: `Crab entry with box number ${boxNumber} deleted successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete crab entry',
        variant: 'destructive',
      })
      throw error
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  return {
    entries,
    loading,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    deleteEntryByBoxNumber
  }
} 