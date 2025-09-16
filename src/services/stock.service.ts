import { supabase } from '@/integrations/supabase/client'

export interface StockLevel {
  category: string
  available_kg: number
  available_pieces: number
  min_stock_kg: number
}

export interface StockRelease {
  id: string
  category: string
  quantity_kg: number
  pieces_count: number
  destination: string
  release_date: string
  notes?: string | null
  created_by: string
  created_at: string
  box_number?: string
}

export interface BulkStockRelease {
  boxes: {
    boxNumber: string
    category: string
    quantity_kg: number
    pieces_count: number
  }[]
  destination: string
  release_date: string
  notes?: string
}

export interface StockAlert {
  category: string
  current_kg: number
  min_stock_kg: number
  status: 'low' | 'critical' | 'normal'
  message: string
}

export const stockService = {
  // Get minimum stock levels by category
  getMinStockLevels(): Record<string, number> {
    return {
      'Boil': 50,    // 50 kg minimum
      'Large': 100,  // 100 kg minimum
      'XL': 150,     // 150 kg minimum
      'XXL': 200,    // 200 kg minimum
      'Jumbo': 250   // 250 kg minimum
    }
  },

  // Get current stock levels for all categories
  async getCurrentStockLevels(): Promise<StockLevel[]> {
    try {
      // Get current stock from crab_entries (the actual inventory)
      // First try with status column, fallback to without if it doesn't exist
      let crabData, crabError
      
      try {
        const result = await supabase
          .from('crab_entries')
          .select('category, weight_kg, male_count, female_count, health_status, status')
          .or('status.is.null,status.neq.released')
        
        crabData = result.data
        crabError = result.error
      } catch (statusError) {
        // Fallback: try without status column
        const result = await supabase
          .from('crab_entries')
          .select('category, weight_kg, male_count, female_count, health_status')
        
        crabData = result.data
        crabError = result.error
      }

      if (crabError) throw crabError

      // Get released stock (handle case where table doesn't exist)
      let releaseData = []
      try {
        const { data, error } = await supabase
          .from('stock_releases')
          .select('*')
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
          throw error
        }
        releaseData = data || []
      } catch (releaseError) {
        // If stock_releases table doesn't exist, just continue with empty array
        console.warn('stock_releases table not found, continuing without release data')
        releaseData = []
      }

      // Calculate available stock by category
      const stockByCategory = new Map<string, StockLevel>()
      const minLevels = this.getMinStockLevels()
      
      // Add crab entries stock
      if (crabData && crabData.length > 0) {
        crabData.forEach(entry => {
          const current = stockByCategory.get(entry.category) || {
            category: entry.category,
            available_kg: 0,
            available_pieces: 0,
            min_stock_kg: minLevels[entry.category] || 100
          }
          current.available_kg += entry.weight_kg || 0
          current.available_pieces += (entry.male_count || 0) + (entry.female_count || 0)
          stockByCategory.set(entry.category, current)
        })
      } else {
        // If no crab data, return empty stock levels for all categories
        const categories = ['Boil', 'Large', 'XL', 'XXL', 'Jumbo']
        categories.forEach(category => {
          stockByCategory.set(category, {
            category,
            available_kg: 0,
            available_pieces: 0,
            min_stock_kg: minLevels[category] || 100
          })
        })
      }

      // Subtract released stock
      releaseData?.forEach(release => {
        const current = stockByCategory.get(release.category)
        if (current) {
          current.available_kg -= release.quantity_kg || 0
          current.available_pieces -= release.pieces_count || 0
          stockByCategory.set(release.category, current)
        }
      })

      return Array.from(stockByCategory.values())
    } catch (error) {
      console.error('Error getting stock levels:', error)
      throw new Error('Failed to get current stock levels')
    }
  },

  // Get stock alerts
  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const stockLevels = await this.getCurrentStockLevels()
      const alerts: StockAlert[] = []

      stockLevels.forEach(stock => {
        if (stock.available_kg <= 0) {
          alerts.push({
            category: stock.category,
            current_kg: stock.available_kg,
            min_stock_kg: stock.min_stock_kg,
            status: 'critical',
            message: `${stock.category} is out of stock!`
          })
        }
        else if (stock.available_kg < stock.min_stock_kg) {
          alerts.push({
            category: stock.category,
            current_kg: stock.available_kg,
            min_stock_kg: stock.min_stock_kg,
            status: 'low',
            message: `${stock.category} is below minimum level (${stock.min_stock_kg} kg)`
          })
        }
        else if (stock.available_kg < stock.min_stock_kg * 1.2) { // Within 20% of minimum
          alerts.push({
            category: stock.category,
            current_kg: stock.available_kg,
            min_stock_kg: stock.min_stock_kg,
            status: 'normal',
            message: `${stock.category} is approaching minimum level`
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error getting stock alerts:', error)
      throw new Error('Failed to get stock alerts')
    }
  },

  // Release stock for a single category
  async releaseStock(releaseData: Omit<StockRelease, 'id' | 'created_at'>): Promise<void> {
    try {
      // Validate stock availability
      const stockLevels = await this.getCurrentStockLevels()
      const currentStock = stockLevels.find(s => s.category === releaseData.category)

      if (!currentStock) {
        throw new Error(`Category ${releaseData.category} not found in stock`)
      }

      if (releaseData.quantity_kg > currentStock.available_kg) {
        throw new Error(`Not enough stock. Available: ${currentStock.available_kg} kg`)
      }

      if (releaseData.pieces_count > currentStock.available_pieces) {
        throw new Error(`Not enough pieces. Available: ${currentStock.available_pieces} pieces`)
      }

      // Insert stock release record
      const { error: releaseError } = await supabase
        .from('stock_releases')
        .insert([{
          ...releaseData,
          created_at: new Date().toISOString()
        }])

      if (releaseError) throw releaseError

      // Check if we need to create alerts
      const remainingStock = currentStock.available_kg - releaseData.quantity_kg
      if (remainingStock < currentStock.min_stock_kg) {
        await this.createStockAlert({
          category: releaseData.category,
          current_kg: remainingStock,
          min_stock_kg: currentStock.min_stock_kg,
          message: `Stock release has put ${releaseData.category} below minimum level`
        })
      }
    } catch (error) {
      console.error('Error releasing stock:', error)
      throw error
    }
  },

  // Create stock alert
  async createStockAlert(alert: Omit<StockAlert, 'status'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .insert([{
          ...alert,
          status: alert.current_kg <= 0 ? 'critical' : 'low',
          created_at: new Date().toISOString()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error creating stock alert:', error)
      throw new Error('Failed to create stock alert')
    }
  },

  // Get stock release history
  async getStockReleaseHistory(
    options: { category?: string; startDate?: string; endDate?: string } = {}
  ): Promise<StockRelease[]> {
    try {
      let query = supabase
        .from('stock_releases')
        .select('*')
        .order('created_at', { ascending: false })

      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.startDate) {
        query = query.gte('release_date', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('release_date', options.endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting stock release history:', error)
      throw new Error('Failed to get stock release history')
    }
  },

  // Release stock in bulk
  async releaseBulkStock(bulkReleaseData: BulkStockRelease): Promise<void> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Validate stock availability for all boxes
      const stockLevels = await this.getCurrentStockLevels()
      const stockByCategory = new Map(stockLevels.map(s => [s.category, s]))

      // Group boxes by category for validation
      const categoryTotals = bulkReleaseData.boxes.reduce((acc, box) => {
        const current = acc.get(box.category) || { quantity_kg: 0, pieces_count: 0 }
        acc.set(box.category, {
          quantity_kg: current.quantity_kg + box.quantity_kg,
          pieces_count: current.pieces_count + box.pieces_count
        })
        return acc
      }, new Map<string, { quantity_kg: number; pieces_count: number }>())

      // Validate stock availability for each category
      for (const [category, totals] of categoryTotals) {
        const currentStock = stockByCategory.get(category)
        if (!currentStock) {
          throw new Error(`Category ${category} not found in stock`)
        }

        if (totals.quantity_kg > currentStock.available_kg) {
          throw new Error(`Not enough stock for ${category}. Available: ${currentStock.available_kg} kg`)
        }

        if (totals.pieces_count > currentStock.available_pieces) {
          throw new Error(`Not enough pieces for ${category}. Available: ${currentStock.available_pieces} pieces`)
        }
      }

      // Create stock releases for each box
      const releases = bulkReleaseData.boxes.map(box => ({
        category: box.category,
        quantity_kg: box.quantity_kg,
        pieces_count: box.pieces_count,
        destination: bulkReleaseData.destination,
        release_date: bulkReleaseData.release_date,
        notes: bulkReleaseData.notes,
        created_by: userData.user.id,
        created_at: new Date().toISOString(),
        box_number: box.boxNumber
      }))

      const { error: releaseError } = await supabase
        .from('stock_releases')
        .insert(releases)

      if (releaseError) throw releaseError

      // Update box statuses
      const { error: boxUpdateError } = await supabase
        .from('crab_entries')
        .update({ status: 'released' })
        .in('box_number', bulkReleaseData.boxes.map(box => box.boxNumber))

      if (boxUpdateError) throw boxUpdateError

      // Check if any categories are now below minimum levels
      const updatedStockLevels = await this.getCurrentStockLevels()
      for (const stock of updatedStockLevels) {
        if (stock.available_kg < stock.min_stock_kg) {
          await this.createStockAlert({
            category: stock.category,
            current_kg: stock.available_kg,
            min_stock_kg: stock.min_stock_kg,
            message: `Bulk release has put ${stock.category} below minimum level`
          })
        }
      }
    } catch (error) {
      console.error('Error releasing bulk stock:', error)
      throw error
    }
  }
}
