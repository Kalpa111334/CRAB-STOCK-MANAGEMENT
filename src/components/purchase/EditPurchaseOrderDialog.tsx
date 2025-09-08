import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calculator, Save, X } from 'lucide-react'
import { Purchase } from '@/types/database'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface EditPurchaseOrderDialogProps {
  purchase: Purchase | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface EditFormData {
  supplier_name: string
  category: 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'
  quantity_kg: number
  pieces_count: number
  unit_price: number
  delivery_date: string
  status: 'pending' | 'completed' | 'cancelled'
  notes: string
}

export const EditPurchaseOrderDialog: React.FC<EditPurchaseOrderDialogProps> = ({
  purchase,
  isOpen,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EditFormData>({
    supplier_name: '',
    category: 'Large',
    quantity_kg: 0,
    pieces_count: 0,
    unit_price: 0,
    delivery_date: '',
    status: 'pending',
    notes: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (purchase && isOpen) {
      const items = purchase.items as any[] || []
      const firstItem = items[0] || {}
      
      setFormData({
        supplier_name: purchase.supplier_name || '',
        category: firstItem.category || 'Large',
        quantity_kg: firstItem.quantity_kg || 0,
        pieces_count: firstItem.pieces_count || 0,
        unit_price: firstItem.unit_price || 0,
        delivery_date: purchase.delivery_date?.split('T')[0] || '',
        status: purchase.status as 'pending' | 'completed' | 'cancelled' || 'pending',
        notes: purchase.notes || ''
      })
    }
  }, [purchase, isOpen])

  const calculateTotal = () => {
    return formData.quantity_kg * formData.unit_price
  }

  const handleChange = (field: keyof EditFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchase) return

    setLoading(true)

    try {
      // Validate form data
      if (!formData.supplier_name || formData.quantity_kg <= 0 || formData.pieces_count <= 0 || formData.unit_price <= 0) {
        throw new Error('Please fill in all fields with valid values')
      }

      const totalAmount = calculateTotal()
      
      const updatedPurchaseData = {
        supplier_name: formData.supplier_name,
        delivery_date: formData.delivery_date,
        total_amount: totalAmount,
        supplier_details: {
          name: formData.supplier_name,
          category: formData.category
        },
        items: [{
          category: formData.category,
          quantity_kg: formData.quantity_kg,
          pieces_count: formData.pieces_count,
          unit_price: formData.unit_price,
          total_price: totalAmount
        }],
        status: formData.status,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('purchases')
        .update(updatedPurchaseData)
        .eq('id', purchase.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Purchase order updated successfully",
        variant: "default"
      })

      onSaved()
      onClose()
    } catch (error) {
      console.error('Error updating purchase:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update purchase order',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!purchase) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Edit Purchase Order
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Order Number:</span> {purchase.order_number}</p>
              <p><span className="font-medium">Created:</span> {new Date(purchase.created_at).toLocaleDateString()}</p>
              <p><span className="font-medium">Currency:</span> {purchase.currency}</p>
              <p><span className="font-medium">Original Total:</span> LKR {purchase.total_amount}</p>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => handleChange('supplier_name', e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (per kg)</Label>
              <Input
                id="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                placeholder="Enter unit price"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes about this order"
              />
            </div>

            {/* Calculation Display */}
            {(formData.quantity_kg > 0 && formData.unit_price > 0) && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Updated Calculation</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p><strong>Quantity:</strong> {formData.quantity_kg} kg</p>
                    <p><strong>Unit Price:</strong> LKR {formData.unit_price} per kg</p>
                    <p className="text-lg font-semibold mt-2">
                      <strong>New Total:</strong> {formData.quantity_kg} kg × LKR {formData.unit_price} = LKR {calculateTotal().toFixed(2)}
                    </p>
                    {calculateTotal() !== purchase.total_amount && (
                      <p className="text-xs mt-1">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Total changed from LKR {purchase.total_amount}
                        </Badge>
                      </p>
                    )}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Purchase Order
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
    </Dialog>
  )
}
