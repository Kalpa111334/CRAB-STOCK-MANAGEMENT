import { supabase } from '@/integrations/supabase/client'
import { Sale } from '@/types/database'

export const salesService = {
  createSale: async (saleData: Partial<Sale>) => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          date: new Date().toISOString(),
          status: 'pending',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  },

  fetchSales: async ({ limit = 10 } = {}) => {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { sales }
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
  },

  getSalesStatistics: async () => {
    try {
      // Get total sales amount
      const { data: totalData, error: totalError } = await supabase
        .from('sales')
        .select('total_amount')

      if (totalError) throw totalError

      // Get completed sales count
      const { count: completedCount, error: completedError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      if (completedError) throw completedError

      // Get pending sales count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      // Get unique customers count
      const { count: customersCount, error: customersError } = await supabase
        .from('sales')
        .select('customer_name', { count: 'exact', head: true })
        .not('customer_name', 'eq', '')
        .not('customer_name', 'is', null)

      if (customersError) throw customersError

      const total_sales = totalData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      return {
        total_sales,
        completed_sales: completedCount || 0,
        pending_sales: pendingCount || 0,
        total_customers: customersCount || 0
      }
    } catch (error) {
      console.error('Error fetching sales statistics:', error)
      throw error
    }
  },

  getSaleById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching sale:', error)
      throw error
    }
  },

  updateSale: async (id: string, updateData: Partial<Sale>) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating sale:', error)
      throw error
    }
  },

  deleteSale: async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting sale:', error)
      throw error
    }
  }
} 