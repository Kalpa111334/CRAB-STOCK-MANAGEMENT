import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle } from 'lucide-react'
import { StockLevel } from '@/services/stock.service'

interface StockLevelCardProps {
  stockLevels: StockLevel[]
  onStockClick?: (category: string) => void
}

export const StockLevelCard: React.FC<StockLevelCardProps> = ({
  stockLevels,
  onStockClick
}) => {
  const getStockStatus = (stock: StockLevel) => {
    if (stock.available_kg <= 0) {
      return {
        color: 'bg-red-50 border-red-200',
        badge: { variant: 'destructive', text: 'Out of Stock' }
      }
    }
    if (stock.available_kg < stock.min_stock_kg) {
      return {
        color: 'bg-yellow-50 border-yellow-200',
        badge: { variant: 'warning', text: 'Low Stock' }
      }
    }
    if (stock.available_kg < stock.min_stock_kg * 1.2) {
      return {
        color: 'bg-blue-50 border-blue-200',
        badge: { variant: 'secondary', text: 'Approaching Min' }
      }
    }
    return {
      color: 'bg-green-50 border-green-200',
      badge: { variant: 'default', text: 'Good' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Current Stock Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stockLevels.map((stock) => {
            const status = getStockStatus(stock)
            return (
              <div
                key={stock.category}
                className={`p-3 rounded-lg border ${status.color} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => onStockClick?.(stock.category)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{stock.category}</span>
                  <Badge variant={status.badge.variant as any}>
                    {status.badge.text}
                  </Badge>
                </div>
                <p className="text-sm">Available: {stock.available_kg} kg</p>
                <p className="text-sm">Pieces: {stock.available_pieces}</p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Min: {stock.min_stock_kg} kg
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
