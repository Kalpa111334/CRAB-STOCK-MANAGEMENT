import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Package, AlertTriangle, X, Send, ArrowDownToLine } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface BulkStockReleaseDialogProps {
  isOpen: boolean
  onClose: () => void
  onReleased: () => void
  selectedBoxes: string[]
  boxEntries: Record<string, any>
}

interface BulkReleaseFormData {
  destination: string
  release_date: string
  notes: string
  boxes: {
    boxNumber: string
    category: string
    quantity_kg: number
    pieces_count: number
    selected: boolean
  }[]
}

export const BulkStockReleaseDialog: React.FC<BulkStockReleaseDialogProps> = ({
  isOpen,
  onClose,
  onReleased,
  selectedBoxes,
  boxEntries
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BulkReleaseFormData>({
    destination: '',
    release_date: new Date().toISOString().split('T')[0],
    notes: '',
    boxes: []
  })
  const { toast } = useToast()

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen && selectedBoxes.length > 0) {
      const boxData = selectedBoxes.map(boxNumber => {
        const entry = boxEntries[boxNumber]
        return {
          boxNumber,
          category: entry?.category || '',
          quantity_kg: entry?.weight_kg || 0,
          pieces_count: (entry?.male_count || 0) + (entry?.female_count || 0),
          selected: true
        }
      }).filter(box => box.category && box.quantity_kg > 0)

      setFormData(prev => ({
        ...prev,
        boxes: boxData
      }))
    }
  }, [isOpen, selectedBoxes, boxEntries])

  const handleChange = (field: keyof Omit<BulkReleaseFormData, 'boxes'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBoxSelectionChange = (boxNumber: string, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      boxes: prev.boxes.map(box => 
        box.boxNumber === boxNumber ? { ...box, selected } : box
      )
    }))
  }

  const validateRelease = (): string[] => {
    const errors: string[] = []
    const selectedBoxes = formData.boxes.filter(box => box.selected)

    if (selectedBoxes.length === 0) {
      errors.push('Select at least one box to release')
    }

    if (!formData.destination) {
      errors.push('Destination is required')
    }

    if (!formData.release_date) {
      errors.push('Release date is required')
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

      const selectedBoxes = formData.boxes.filter(box => box.selected)

      // Create stock releases for each selected box
      const releases = selectedBoxes.map(box => ({
        category: box.category,
        quantity_kg: box.quantity_kg,
        pieces_count: box.pieces_count,
        destination: formData.destination,
        release_date: formData.release_date,
        notes: `Box ${box.boxNumber}: ${formData.notes}`,
        created_by: userData.user.id,
        created_at: new Date().toISOString(),
        box_number: box.boxNumber
      }))

      const { error: releaseError } = await supabase
        .from('stock_releases')
        .insert(releases)

      if (releaseError) throw releaseError

      // Update box status to released
      const { error: boxUpdateError } = await supabase
        .from('crab_entries')
        .update({ status: 'released' })
        .in('box_number', selectedBoxes.map(box => box.boxNumber))

      if (boxUpdateError) throw boxUpdateError

      toast({
        title: "Success",
        description: `Released ${selectedBoxes.length} boxes successfully`,
        variant: "default"
      })

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

  const getTotalWeight = () => {
    return formData.boxes
      .filter(box => box.selected)
      .reduce((sum, box) => sum + box.quantity_kg, 0)
  }

  const getTotalPieces = () => {
    return formData.boxes
      .filter(box => box.selected)
      .reduce((sum, box) => sum + box.pieces_count, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Bulk Stock Release
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Boxes Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Selected Boxes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.boxes.map(box => (
                  <div
                    key={box.boxNumber}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/10"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={box.selected}
                        onCheckedChange={(checked) => 
                          handleBoxSelectionChange(box.boxNumber, checked as boolean)
                        }
                      />
                      <div>
                        <p className="font-medium">Box {box.boxNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {box.category} - {box.quantity_kg} kg ({box.pieces_count} pieces)
                        </p>
                      </div>
                    </div>
                    <Badge>{box.category}</Badge>
                  </div>
                ))}

                {/* Totals */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Weight:</span>
                    <span>{getTotalWeight()} kg</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium">Total Pieces:</span>
                    <span>{getTotalPieces()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Release Details */}
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes about this release"
              />
            </div>
          </div>

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
                  Release Selected Boxes
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
      </DialogContent>
    </Dialog>
  )
}
