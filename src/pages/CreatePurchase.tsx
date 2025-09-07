import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { useNavigate } from 'react-router-dom'
import { Loader2, Calculator } from 'lucide-react'
import { PurchaseOrderPreview } from '@/components/purchase/PurchaseOrderPreview'
import { Purchase } from '@/types/database'

interface PurchaseFormData {
  supplier_name: string
  category: 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'
  quantity_kg: number
  pieces_count: number
  unit_price: number
}

const CreatePurchase = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_name: '',
    category: 'Large',
    quantity_kg: 0,
    pieces_count: 0,
    unit_price: 0
  })
  const [showPreview, setShowPreview] = useState(false)
  const [createdPurchase, setCreatedPurchase] = useState<Purchase | null>(null)
  const sweetAlert = useSweetAlert()
  const navigate = useNavigate()

  const calculateTotal = () => {
    return formData.quantity_kg * formData.unit_price
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form data
      if (!formData.supplier_name || formData.quantity_kg <= 0 || formData.pieces_count <= 0 || formData.unit_price <= 0) {
        throw new Error('Please fill in all fields with valid values')
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const totalAmount = calculateTotal()
      
      const purchaseData = {
        date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
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
        created_by: userData.user.id,
        order_number: `PO-${Date.now()}`,
        supplier_name: formData.supplier_name,
        currency: 'LKR',
        status: 'pending',
        notes: null,
        payment_terms: 'Net 30'
      }

      const { data: purchaseResult, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Set the created purchase and show preview
      setCreatedPurchase(purchaseResult)
      setShowPreview(true)
      
      sweetAlert.success('Purchase order created successfully! Preview is now available.')
    } catch (error) {
      console.error('Error creating purchase:', error)
      sweetAlert.error(error instanceof Error ? error.message : 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof PurchaseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setCreatedPurchase(null)
    navigate('/dashboard/purchasing')
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Purchase Order</h1>
        <p className="text-muted-foreground">Enter purchase order details</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  min="0"
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
                  min="0"
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
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                placeholder="Enter unit price"
              />
            </div>

            {/* Calculation Display */}
            {(formData.quantity_kg > 0 && formData.unit_price > 0) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Price Calculation</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p><strong>Quantity:</strong> {formData.quantity_kg} kg</p>
                    <p><strong>Unit Price:</strong> LKR {formData.unit_price} per kg</p>
                    <p className="text-lg font-semibold mt-2">
                      <strong>Total:</strong> {formData.quantity_kg} kg × LKR {formData.unit_price} = LKR {calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Purchase Order...
                  </>
                ) : (
                  'Create Purchase Order'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Purchase Order Preview */}
      {createdPurchase && (
        <PurchaseOrderPreview
          purchase={createdPurchase}
          isOpen={showPreview}
          onClose={handleClosePreview}
        />
      )}
    </div>
  )
}

export default CreatePurchase 