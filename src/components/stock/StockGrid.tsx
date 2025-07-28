import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface StockSummary {
  category: string
  report_type: string
  total_weight: number
  total_pieces: number
  healthy_pieces: number
  damaged_pieces: number
  total_entries: number
  last_updated: string
}

interface StockGridProps {
  reportType?: 'TSF' | 'Dutch_Trails'
}

export const StockGrid: React.FC<StockGridProps> = ({ reportType = 'TSF' }) => {
  const [stockData, setStockData] = useState<StockSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('*')
        .eq('report_type', reportType)
        .order('category')

      if (error) throw error
      setStockData(data || [])
    } catch (error) {
      console.error('Error fetching stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData()

    // Set up real-time subscription
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crab_entries'
        },
        () => {
          fetchStockData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reportType])

  const categories = ['Boil', 'Large', 'XL', 'XXL', 'Jumbo']
  
  const getStockForCategory = (category: string) => {
    return stockData.find(item => item.category === category) || {
      category,
      report_type: reportType,
      total_weight: 0,
      total_pieces: 0,
      healthy_pieces: 0,
      damaged_pieces: 0,
      total_entries: 0,
      last_updated: ''
    }
  }

  const getTotalStock = () => {
    return stockData.reduce((acc, item) => ({
      total_weight: acc.total_weight + item.total_weight,
      total_pieces: acc.total_pieces + item.total_pieces,
      healthy_pieces: acc.healthy_pieces + item.healthy_pieces,
      damaged_pieces: acc.damaged_pieces + item.damaged_pieces,
    }), { total_weight: 0, total_pieces: 0, healthy_pieces: 0, damaged_pieces: 0 })
  }

  const totalStock = getTotalStock()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">
            Total {reportType === 'TSF' ? 'Tropical Sel-Fish' : 'Dutch Trails'} Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalStock.total_weight.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Weight (KG)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{totalStock.total_pieces}</p>
              <p className="text-sm text-muted-foreground">Total Pieces</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalStock.healthy_pieces}</p>
              <p className="text-sm text-muted-foreground">Healthy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{totalStock.damaged_pieces}</p>
              <p className="text-sm text-muted-foreground">Damaged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {categories.map((category) => {
          const stock = getStockForCategory(category)
          const availableStock = stock.healthy_pieces
          
          return (
            <Card key={category} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {category}
                  <Badge variant={availableStock > 0 ? 'default' : 'secondary'}>
                    {availableStock > 0 ? 'In Stock' : 'Empty'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Weight:</span>
                    <span className="font-semibold">{stock.total_weight.toFixed(2)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Pieces:</span>
                    <span className="font-semibold">{stock.total_pieces}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Healthy:</span>
                    <span className="font-semibold text-green-600">{stock.healthy_pieces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-destructive">Damaged:</span>
                    <span className="font-semibold text-destructive">{stock.damaged_pieces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-primary">Available:</span>
                    <span className="font-semibold text-primary">{availableStock}</span>
                  </div>
                </div>
                
                {stock.total_entries > 0 && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground text-center">
                      {stock.total_entries} entries
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}