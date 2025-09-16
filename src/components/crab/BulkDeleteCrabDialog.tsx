import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useBulkCrabDeletion } from '@/hooks/use-bulk-crab-deletion'
import { usePermissions } from '@/hooks/use-permissions'
import { Trash2, Search, AlertTriangle, Package, X, CheckSquare, Square } from 'lucide-react'

interface CrabBox {
  id: string
  box_number: string
  category: string
  weight_kg: number
  supplier: string
  health_status: 'healthy' | 'damaged'
  date: string
  male_count: number
  female_count: number
}

interface Props {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function BulkDeleteCrabDialog({ trigger, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [crabBoxes, setCrabBoxes] = useState<CrabBox[]>([])
  const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const { canDeleteCrab } = usePermissions()
  const { bulkDeleteCrabs, getAvailableCrabBoxes } = useBulkCrabDeletion()

  // Fetch crab boxes when dialog opens
  useEffect(() => {
    if (open) {
      fetchCrabBoxes()
    }
  }, [open])

  const fetchCrabBoxes = async () => {
    setFetching(true)
    try {
      const boxes = await getAvailableCrabBoxes()
      setCrabBoxes(boxes)
    } catch (error) {
      console.error('Error fetching crab boxes:', error)
    } finally {
      setFetching(false)
    }
  }

  const filteredBoxes = crabBoxes.filter(box =>
    box.box_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBoxSelection = (boxNumber: string, checked: boolean) => {
    const newSelection = new Set(selectedBoxes)
    if (checked) {
      newSelection.add(boxNumber)
    } else {
      newSelection.delete(boxNumber)
    }
    setSelectedBoxes(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedBoxes.size === filteredBoxes.length) {
      setSelectedBoxes(new Set())
    } else {
      setSelectedBoxes(new Set(filteredBoxes.map(box => box.box_number)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedBoxes.size === 0) return

    setLoading(true)
    try {
      const result = await bulkDeleteCrabs(Array.from(selectedBoxes))
      
      if (result.success) {
        setOpen(false)
        setSelectedBoxes(new Set())
        setSearchTerm('')
        onSuccess?.()
      }
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedBoxes(new Set())
    setSearchTerm('')
  }

  const getTotalWeight = () => {
    return Array.from(selectedBoxes).reduce((total, boxNumber) => {
      const box = crabBoxes.find(b => b.box_number === boxNumber)
      return total + (box?.weight_kg || 0)
    }, 0)
  }

  const getTotalPieces = () => {
    return Array.from(selectedBoxes).reduce((total, boxNumber) => {
      const box = crabBoxes.find(b => b.box_number === boxNumber)
      return total + (box?.male_count || 0) + (box?.female_count || 0)
    }, 0)
  }

  if (!canDeleteCrab) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Bulk Delete Crabs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Bulk Delete Crab Entries
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              Warning
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This action will permanently delete the selected crab entries from the database. 
              This cannot be undone and will affect stock calculations.
            </p>
          </div>

          {/* Search and Selection Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by box number, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={filteredBoxes.length === 0}
              >
                {selectedBoxes.size === filteredBoxes.length && filteredBoxes.length > 0 ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
            </div>

            {/* Selection Summary */}
            {selectedBoxes.size > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {selectedBoxes.size} box{selectedBoxes.size !== 1 ? 'es' : ''} selected
                      </span>
                    </div>
                    <div className="text-sm text-blue-600">
                      {getTotalWeight().toFixed(2)} kg • {getTotalPieces()} pieces
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Crab Boxes List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredBoxes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No crab boxes found matching your search.' : 'No crab boxes available.'}
              </div>
            ) : (
              filteredBoxes.map((box) => (
                <Card key={box.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedBoxes.has(box.box_number)}
                        onCheckedChange={(checked) => 
                          handleBoxSelection(box.box_number, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">Box {box.box_number}</div>
                            <Badge variant="secondary">{box.category}</Badge>
                            <Badge 
                              variant={box.health_status === 'healthy' ? 'default' : 'destructive'}
                            >
                              {box.health_status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {box.weight_kg} kg • {box.male_count + box.female_count} pieces
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Supplier: {box.supplier} • Added: {new Date(box.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={loading || selectedBoxes.size === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting {selectedBoxes.size} Entries...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedBoxes.size} Selected Entries
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
