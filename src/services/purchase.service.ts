import { supabase } from '@/integrations/supabase/client'
import { Purchase } from '@/types/database'

export interface UpdatePurchaseData {
  supplier_name: string
  delivery_date: string
  total_amount: number
  supplier_details: any
  items: any[]
  status: string
  notes?: string | null
  updated_at: string
}

export const purchaseService = {
  // Update a purchase order
  async updatePurchase(purchaseId: string, data: UpdatePurchaseData): Promise<Purchase> {
    const { data: result, error } = await supabase
      .from('purchases')
      .update(data)
      .eq('id', purchaseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating purchase:', error)
      throw new Error(`Failed to update purchase order: ${error.message}`)
    }

    return result
  },

  // Delete a purchase order
  async deletePurchase(purchaseId: string): Promise<void> {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchaseId)

    if (error) {
      console.error('Error deleting purchase:', error)
      throw new Error(`Failed to delete purchase order: ${error.message}`)
    }
  },

  // Get purchase order by ID
  async getPurchaseById(purchaseId: string): Promise<Purchase> {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (error) {
      console.error('Error fetching purchase:', error)
      throw new Error(`Failed to fetch purchase order: ${error.message}`)
    }

    return data
  },

  // Check if purchase order can be deleted (business rules)
  async canDeletePurchase(purchase: Purchase): Promise<{ canDelete: boolean; reason?: string }> {
    // Check if the purchase order is completed
    if (purchase.status === 'completed') {
      return {
        canDelete: false,
        reason: 'Cannot delete completed purchase orders. You can only cancel them.'
      }
    }

    // Check if purchase is recent (within last 30 days for deletion safety)
    const createdDate = new Date(purchase.created_at)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (createdDate < thirtyDaysAgo) {
      return {
        canDelete: false,
        reason: 'Cannot delete purchase orders older than 30 days for audit purposes.'
      }
    }

    return { canDelete: true }
  },

  // Check if purchase order can be edited
  async canEditPurchase(purchase: Purchase): Promise<{ canEdit: boolean; reason?: string }> {
    // Can always edit pending orders
    if (purchase.status === 'pending') {
      return { canEdit: true }
    }

    // Cannot edit cancelled orders
    if (purchase.status === 'cancelled') {
      return {
        canEdit: false,
        reason: 'Cannot edit cancelled purchase orders.'
      }
    }

    // Completed orders can be edited with caution
    if (purchase.status === 'completed') {
      return {
        canEdit: true,
        reason: 'This order is completed. Editing will change the status to pending.'
      }
    }

    return { canEdit: true }
  },

  // Validate purchase order data
  validatePurchaseData(data: UpdatePurchaseData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.supplier_name || data.supplier_name.trim().length === 0) {
      errors.push('Supplier name is required')
    }

    if (!data.delivery_date) {
      errors.push('Delivery date is required')
    }

    if (data.total_amount <= 0) {
      errors.push('Total amount must be greater than 0')
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required')
    } else {
      data.items.forEach((item, index) => {
        if (!item.category) {
          errors.push(`Item ${index + 1}: Category is required`)
        }
        if (item.quantity_kg <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
        }
        if (item.unit_price <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`)
        }
        if (item.pieces_count <= 0) {
          errors.push(`Item ${index + 1}: Pieces count must be greater than 0`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
