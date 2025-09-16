import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/use-sweet-alert'

export interface BulkCrabDeletionResult {
  success: boolean
  deletedEntries?: any[]
  error?: string
  failedDeletions?: string[]
}

export function useBulkCrabDeletion() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const sweetAlert = useSweetAlert()

  const findCrabsByBoxNumbers = async (boxNumbers: string[]) => {
    try {
      const { data, error } = await supabase
        .from('crab_entries')
        .select('*')
        .in('box_number', boxNumbers)

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error finding crabs by box numbers:', error)
      throw new Error('Failed to search for crab entries')
    }
  }

  const bulkDeleteCrabs = async (boxNumbers: string[]): Promise<BulkCrabDeletionResult> => {
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to delete crab entries'
      }
    }

    if (boxNumbers.length === 0) {
      return {
        success: false,
        error: 'No box numbers provided for deletion'
      }
    }

    setLoading(true)
    try {
      // First, find all crab entries by box numbers
      const crabEntries = await findCrabsByBoxNumbers(boxNumbers)
      
      if (crabEntries.length === 0) {
        return {
          success: false,
          error: 'No crab entries found with the provided box numbers'
        }
      }

      // Show confirmation with crab details
      const crabDetails = crabEntries.map(crab => 
        `Box ${crab.box_number}: ${crab.category} (${crab.weight_kg}kg) - ${crab.supplier}`
      ).join('\n')

      const confirmed = await sweetAlert.confirm(
        'Bulk Delete Confirmation',
        `Are you sure you want to permanently delete ${crabEntries.length} crab entries?\n\n` +
        `Selected entries:\n${crabDetails}\n\n` +
        `⚠️ This action cannot be undone!`,
        'Delete All',
        'Cancel'
      )

      if (!confirmed) {
        return {
          success: false,
          error: 'Deletion cancelled by user'
        }
      }

      // Delete all crab entries
      const { error: deleteError } = await supabase
        .from('crab_entries')
        .delete()
        .in('box_number', boxNumbers)

      if (deleteError) throw deleteError

      toast({
        title: 'Success',
        description: `${crabEntries.length} crab entries have been permanently deleted`,
      })

      return {
        success: true,
        deletedEntries: crabEntries
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete crab entries'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const getAvailableCrabBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('crab_entries')
        .select('id, box_number, category, weight_kg, supplier, health_status, date, male_count, female_count')
        .order('box_number')

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching crab boxes:', error)
      throw new Error('Failed to fetch crab boxes')
    }
  }

  return {
    loading,
    findCrabsByBoxNumbers,
    bulkDeleteCrabs,
    getAvailableCrabBoxes
  }
}
