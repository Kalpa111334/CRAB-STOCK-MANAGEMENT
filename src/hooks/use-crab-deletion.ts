import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/use-sweet-alert'

export interface CrabDeletionResult {
  success: boolean
  deletedEntry?: any
  error?: string
}

export function useCrabDeletion() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const sweetAlert = useSweetAlert()

  const findCrabByBoxNumber = async (boxNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('crab_entries')
        .select('*')
        .eq('box_number', boxNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No crab found with this box number
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Error finding crab by box number:', error)
      throw new Error('Failed to search for crab entry')
    }
  }

  const permanentlyDeleteCrab = async (boxNumber: string): Promise<CrabDeletionResult> => {
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to delete crab entries'
      }
    }

    setLoading(true)
    try {
      // First, find the crab entry by box number
      const crabEntry = await findCrabByBoxNumber(boxNumber)
      
      if (!crabEntry) {
        return {
          success: false,
          error: `No crab entry found with box number: ${boxNumber}`
        }
      }

      // Show confirmation with crab details
      const confirmed = await sweetAlert.confirm(
        'Permanent Delete Confirmation',
        `Are you sure you want to permanently delete this crab entry?\n\n` +
        `Box Number: ${crabEntry.box_number}\n` +
        `Category: ${crabEntry.category}\n` +
        `Weight: ${crabEntry.weight_kg} kg\n` +
        `Supplier: ${crabEntry.supplier}\n` +
        `Health Status: ${crabEntry.health_status}\n\n` +
        `⚠️ This action cannot be undone!`,
        'Delete',
        'Cancel'
      )

      if (!confirmed) {
        return {
          success: false,
          error: 'Deletion cancelled by user'
        }
      }

      // Delete the crab entry
      const { error: deleteError } = await supabase
        .from('crab_entries')
        .delete()
        .eq('box_number', boxNumber)

      if (deleteError) throw deleteError

      toast({
        title: 'Success',
        description: `Crab entry with box number ${boxNumber} has been permanently deleted`,
      })

      return {
        success: true,
        deletedEntry: crabEntry
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete crab entry'
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

  return {
    loading,
    findCrabByBoxNumber,
    permanentlyDeleteCrab
  }
}
