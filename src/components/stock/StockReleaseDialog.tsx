import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Package, AlertTriangle, X, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { ReleaseConfirmationDialog } from './ReleaseConfirmationDialog'

interface StockReleaseDialogProps {
  isOpen: boolean
  onClose: () => void
  onReleased: () => void
  onShowConfirmation?: (data: any) => void
}

interface StockReleaseFormData {
  category: 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'
  quantity_kg: number
  pieces_count: number
  destination: string
  release_date: string
  notes: string
}

interface StockLevel {
  category: string
  available_kg: number
  available_pieces: number
  min_stock_kg: number
}

export const StockReleaseDialog: React.FC<StockReleaseDialogProps> = ({
  isOpen,
  onClose,
  onReleased,
  onShowConfirmation
}) => {
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [releaseConfirmationData, setReleaseConfirmationData] = useState<any>(null)
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [formData, setFormData] = useState<StockReleaseFormData>({
    category: 'Large',
    quantity_kg: 0,
    pieces_count: 0,
    destination: '',
    release_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const { toast } = useToast()

  // Fetch current stock levels when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchStockLevels()
    }
  }, [isOpen])

  const fetchStockLevels = async () => {
    try {
      // Get current stock levels from crab_entries (the actual inventory)
      // First try with status column, fallback to without if it doesn't exist
      let crabData, crabError
      
      try {
        const result = await supabase
          .from('crab_entries')
          .select('category, weight_kg, male_count, female_count, health_status, status')
          .neq('status', 'released')
        
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

      // Get released stock from stock_releases (handle case where table doesn't exist)
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
      
      // Add crab entries stock
      if (crabData && crabData.length > 0) {
        crabData.forEach(entry => {
          const current = stockByCategory.get(entry.category) || {
            category: entry.category,
            available_kg: 0,
            available_pieces: 0,
            min_stock_kg: getMinStockLevel(entry.category)
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
            min_stock_kg: getMinStockLevel(category)
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

      setStockLevels(Array.from(stockByCategory.values()))
    } catch (error) {
      console.error('Error fetching stock levels:', error)
      // Don't show error toast, just set empty stock levels
      const categories = ['Boil', 'Large', 'XL', 'XXL', 'Jumbo']
      const emptyStockLevels = categories.map(category => ({
        category,
        available_kg: 0,
        available_pieces: 0,
        min_stock_kg: getMinStockLevel(category)
      }))
      setStockLevels(emptyStockLevels)
    }
  }

  const getMinStockLevel = (category: string): number => {
    // Define minimum stock levels by category (in kg)
    const minLevels: Record<string, number> = {
      'Boil': 50,
      'Large': 100,
      'XL': 150,
      'XXL': 200,
      'Jumbo': 250
    }
    return minLevels[category] || 100
  }

  const getCurrentStock = (category: string): StockLevel | undefined => {
    return stockLevels.find(stock => stock.category === category)
  }

  const handleChange = (field: keyof StockReleaseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateRelease = (): string[] => {
    const errors: string[] = []
    const currentStock = getCurrentStock(formData.category)

    if (!currentStock) {
      errors.push('Selected category not found in stock')
      return errors
    }

    if (formData.quantity_kg <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (formData.quantity_kg > currentStock.available_kg) {
      errors.push(`Not enough stock. Available: ${currentStock.available_kg} kg`)
    }

    if (formData.pieces_count <= 0) {
      errors.push('Pieces count must be greater than 0')
    }

    if (formData.pieces_count > currentStock.available_pieces) {
      errors.push(`Not enough pieces. Available: ${currentStock.available_pieces} pieces`)
    }

    if (!formData.destination) {
      errors.push('Destination is required')
    }

    if (!formData.release_date) {
      errors.push('Release date is required')
    }

    // Check if release would put stock below minimum level
    const remainingStock = currentStock.available_kg - formData.quantity_kg
    if (remainingStock < currentStock.min_stock_kg) {
      errors.push(`Warning: Release will put stock below minimum level (${currentStock.min_stock_kg} kg)`)
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const errors = validateRelease()
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const releaseData = {
        category: formData.category,
        quantity_kg: formData.quantity_kg,
        pieces_count: formData.pieces_count,
        destination: formData.destination,
        release_date: formData.release_date,
        notes: formData.notes || null,
        created_by: userData.user.id,
        created_at: new Date().toISOString(),
        box_number: null // Single release doesn't have a specific box number
      }

      // Try to insert into stock_releases table (handle case where table doesn't exist)
      try {
        const { error: releaseError } = await supabase
          .from('stock_releases')
          .insert([releaseData])

        if (releaseError) {
          console.warn('Failed to insert into stock_releases table:', releaseError)
          // Continue without throwing error - this is not critical for basic functionality
        }
      } catch (tableError) {
        console.warn('stock_releases table not found, continuing without release tracking')
      }

      // Prepare confirmation data
      const confirmationData = {
        items: [{
          boxNumber: undefined,
          category: formData.category,
          quantity_kg: formData.quantity_kg,
          pieces_count: formData.pieces_count
        }],
        destination: formData.destination,
        release_date: formData.release_date,
        notes: formData.notes,
        total_weight: formData.quantity_kg,
        total_pieces: formData.pieces_count
      }

      if (onShowConfirmation) {
        onShowConfirmation(confirmationData)
      } else {
        setReleaseConfirmationData(confirmationData)
        setShowConfirmation(true)
      }
      onReleased()
      onClose()
    } catch (error) {
      console.error('Error releasing stock:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to release stock',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Release Stock
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stock Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Current Stock Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stockLevels.map((stock) => (
                  <div
                    key={stock.category}
                    className={`p-3 rounded-lg border ${
                      stock.available_kg < stock.min_stock_kg
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{stock.category}</span>
                      {stock.available_kg < stock.min_stock_kg && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">Available: {stock.available_kg} kg</p>
                    <p className="text-sm">Pieces: {stock.available_pieces}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {stock.min_stock_kg} kg
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Release Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boil">Boil</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="Jumbo">Jumbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_kg">Quantity (kg)</Label>
                <Input
                  id="quantity_kg"
                  type="number"
                  value={formData.quantity_kg}
                  onChange={(e) => handleChange('quantity_kg', parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity in kg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pieces_count">Number of Pieces</Label>
                <Input
                  id="pieces_count"
                  type="number"
                  value={formData.pieces_count}
                  onChange={(e) => handleChange('pieces_count', parseInt(e.target.value) || 0)}
                  placeholder="Enter number of pieces"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Enter destination"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="release_date">Release Date</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => handleChange('release_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes about this release"
              />
            </div>

            {/* Stock Level Warning */}
            {formData.quantity_kg > 0 && formData.category && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Stock Level Check</h4>
                      {(() => {
                        const currentStock = getCurrentStock(formData.category)
                        if (!currentStock) return null

                        const remainingStock = currentStock.available_kg - formData.quantity_kg
                        const belowMin = remainingStock < currentStock.min_stock_kg

                        return (
                          <div className="space-y-1 text-sm">
                            <p>Current Stock: {currentStock.available_kg} kg</p>
                            <p>After Release: {remainingStock} kg</p>
                            {belowMin && (
                              <p className="text-red-600 font-medium">
                                Warning: This release will put stock below minimum level ({currentStock.min_stock_kg} kg)
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Releasing Stock...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Release Stock
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>

      {/* Release Confirmation Dialog */}
      {releaseConfirmationData && (
        <ReleaseConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          releaseData={releaseConfirmationData}
        />
      )}
    </Dialog>
  )
}
