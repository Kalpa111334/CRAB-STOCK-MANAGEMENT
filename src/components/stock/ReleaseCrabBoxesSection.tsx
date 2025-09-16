import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, ArrowDown, Box, CheckCircle, AlertCircle, Truck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { StockReleaseDialog } from './StockReleaseDialog'
import { BulkStockReleaseDialog } from './BulkStockReleaseDialog'
import { ReleaseConfirmationDialog } from './ReleaseConfirmationDialog'

interface StockLevel {
  category: string
  available_kg: number
  available_pieces: number
  min_stock_kg: number
}

interface ReleasedBox {
  id: string
  box_number: string
  category: string
  quantity_kg: number
  pieces_count: number
  destination: string
  release_date: string
  status: 'ready' | 'dispatched'
}

export const ReleaseCrabBoxesSection = () => {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [releasedBoxes, setReleasedBoxes] = useState<ReleasedBox[]>([])
  const [showSingleRelease, setShowSingleRelease] = useState(false)
  const [showBulkRelease, setShowBulkRelease] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [releaseConfirmationData, setReleaseConfirmationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch stock levels
  const fetchStockLevels = async () => {
    try {
      const { data: crabEntries, error } = await supabase
        .from('crab_entries')
        .select('category, weight_kg, male_count, female_count, status')
        .or('status.is.null,status.neq.released')

      if (error) throw error

      // Calculate stock levels by category
      const stockMap = new Map<string, StockLevel>()
      
      crabEntries?.forEach(entry => {
        const category = entry.category
        const totalPieces = (entry.male_count || 0) + (entry.female_count || 0)
        
        if (stockMap.has(category)) {
          const existing = stockMap.get(category)!
          stockMap.set(category, {
            ...existing,
            available_kg: existing.available_kg + (entry.weight_kg || 0),
            available_pieces: existing.available_pieces + totalPieces
          })
        } else {
          stockMap.set(category, {
            category,
            available_kg: entry.weight_kg || 0,
            available_pieces: totalPieces,
            min_stock_kg: getMinStockLevel(category)
          })
        }
      })

      setStockLevels(Array.from(stockMap.values()))
    } catch (error) {
      console.error('Error fetching stock levels:', error)
      toast({
        title: "Error",
        description: "Failed to fetch stock levels",
        variant: "destructive"
      })
    }
  }

  // Fetch released boxes
  const fetchReleasedBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_releases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.warn('Failed to fetch released boxes:', error)
        return
      }

      const boxes: ReleasedBox[] = (data || []).map(release => ({
        id: release.id,
        box_number: release.box_number || 'N/A',
        category: release.category,
        quantity_kg: release.quantity_kg,
        pieces_count: release.pieces_count,
        destination: release.destination,
        release_date: release.release_date,
        status: 'ready' as const
      }))

      setReleasedBoxes(boxes)
    } catch (error) {
      console.error('Error fetching released boxes:', error)
    }
  }

  const getMinStockLevel = (category: string): number => {
    const minLevels: Record<string, number> = {
      'Boil': 50,
      'Large': 100,
      'XL': 150,
      'XXL': 200,
      'Jumbo': 250
    }
    return minLevels[category] || 100
  }

  const getStockStatus = (category: string) => {
    const stock = stockLevels.find(s => s.category === category)
    if (!stock) return { status: 'no-stock', color: 'destructive' }
    
    if (stock.available_kg <= 0) return { status: 'out-of-stock', color: 'destructive' }
    if (stock.available_kg < stock.min_stock_kg) return { status: 'low-stock', color: 'warning' }
    return { status: 'in-stock', color: 'success' }
  }

  const getTotalReleasedBoxes = () => {
    return releasedBoxes.length
  }

  const getReadyForDispatch = () => {
    return releasedBoxes.filter(box => box.status === 'ready').length
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchStockLevels(),
        fetchReleasedBoxes()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [])

  const handleReleaseSuccess = () => {
    fetchStockLevels()
    fetchReleasedBoxes()
  }

  const handleShowConfirmation = (data: any) => {
    setReleaseConfirmationData(data)
    setShowConfirmation(true)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Released Boxes Overview */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Released Boxes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{getTotalReleasedBoxes()}</div>
              <div className="text-sm text-blue-600 mt-1">Total Released</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{getReadyForDispatch()}</div>
              <div className="text-sm text-green-600 mt-1">Ready for Dispatch</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {getTotalReleasedBoxes() - getReadyForDispatch()}
              </div>
              <div className="text-sm text-orange-600 mt-1">Dispatched</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Levels Overview */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Box className="h-5 w-5" />
            Current Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockLevels.map((stock) => {
              const status = getStockStatus(stock.category)
              return (
                <div key={stock.category} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{stock.category}</h3>
                    <Badge variant={status.color as any}>
                      {status.status === 'no-stock' && 'No Stock'}
                      {status.status === 'out-of-stock' && 'Out of Stock'}
                      {status.status === 'low-stock' && 'Low Stock'}
                      {status.status === 'in-stock' && 'In Stock'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Available: {stock.available_kg.toFixed(2)} kg</div>
                    <div>Pieces: {stock.available_pieces}</div>
                    <div>Min Level: {stock.min_stock_kg} kg</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Release Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Release Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => setShowSingleRelease(true)}
              className="h-16 border-primary text-primary hover:bg-primary/10"
              variant="outline"
            >
              <ArrowDown className="mr-2 h-5 w-5" />
              Single Release
            </Button>
            <Button
              onClick={() => setShowBulkRelease(true)}
              className="h-16 border-primary text-primary hover:bg-primary/10"
              variant="outline"
            >
              <Package className="mr-2 h-5 w-5" />
              Bulk Release
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Releases */}
      {releasedBoxes.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Recent Releases
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            <div className="space-y-3">
              {releasedBoxes.slice(0, 5).map((box) => (
                <div key={box.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Box {box.box_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {box.category} • {box.quantity_kg}kg • {box.pieces_count} pieces
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{box.destination}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(box.release_date).toLocaleDateString()}
                    </div>
                    <Badge 
                      variant={box.status === 'ready' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {box.status === 'ready' ? 'Ready' : 'Dispatched'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <StockReleaseDialog
        isOpen={showSingleRelease}
        onClose={() => setShowSingleRelease(false)}
        onReleased={handleReleaseSuccess}
        onShowConfirmation={handleShowConfirmation}
      />

      <BulkStockReleaseDialog
        isOpen={showBulkRelease}
        onClose={() => setShowBulkRelease(false)}
        onReleased={handleReleaseSuccess}
        selectedBoxes={[]}
        boxEntries={{}}
        onShowConfirmation={handleShowConfirmation}
      />

      <ReleaseConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        releaseData={releaseConfirmationData}
      />
    </div>
  )
}
