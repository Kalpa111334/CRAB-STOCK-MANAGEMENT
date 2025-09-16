import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Loader2, Trash2, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

type CrabCategory = 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'

interface GRNItem {
  item: string
  category: CrabCategory
  quantity_pieces: number
  quantity_kg: number
  price?: number
}

interface GRNEntry {
  id: string
  supplier_name: string
  delivered_by: string
  received_condition: string
  date: string
  receiving_time: string
  items: GRNItem[]
}

interface BulkGRNFormData {
  grns: GRNEntry[]
}

export const BulkGRNDialog = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<BulkGRNFormData>({
    grns: [{
      id: '1',
      supplier_name: '',
      delivered_by: '',
      received_condition: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      receiving_time: format(new Date(), 'HH:mm'),
      items: [{ item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
    }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdGRNs, setCreatedGRNs] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const handleGRNChange = (grnIndex: number, field: keyof Omit<GRNEntry, 'id' | 'items'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      grns: prev.grns.map((grn, index) => 
        index === grnIndex ? { ...grn, [field]: value } : grn
      )
    }))
  }

  const handleItemChange = (grnIndex: number, itemIndex: number, field: keyof GRNItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      grns: prev.grns.map((grn, gIndex) => 
        gIndex === grnIndex 
          ? {
              ...grn,
              items: grn.items.map((item, iIndex) => 
                iIndex === itemIndex ? { ...item, [field]: value } : item
              )
            }
          : grn
      )
    }))
  }

  const addGRN = () => {
    const newGRN: GRNEntry = {
      id: Date.now().toString(),
      supplier_name: '',
      delivered_by: '',
      received_condition: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      receiving_time: format(new Date(), 'HH:mm'),
      items: [{ item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
    }
    
    setFormData(prev => ({
      ...prev,
      grns: [...prev.grns, newGRN]
    }))
  }

  const removeGRN = (grnIndex: number) => {
    if (formData.grns.length === 1) return // Keep at least one GRN
    
    setFormData(prev => ({
      ...prev,
      grns: prev.grns.filter((_, index) => index !== grnIndex)
    }))
  }

  const addItem = (grnIndex: number) => {
    setFormData(prev => ({
      ...prev,
      grns: prev.grns.map((grn, index) => 
        index === grnIndex 
          ? {
              ...grn,
              items: [...grn.items, { item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
            }
          : grn
      )
    }))
  }

  const removeItem = (grnIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      grns: prev.grns.map((grn, gIndex) => 
        gIndex === grnIndex 
          ? {
              ...grn,
              items: grn.items.length > 1 
                ? grn.items.filter((_, iIndex) => iIndex !== itemIndex)
                : grn.items
            }
          : grn
      )
    }))
  }

  const copyGRN = (grnIndex: number) => {
    const grnToCopy = formData.grns[grnIndex]
    const newGRN: GRNEntry = {
      ...grnToCopy,
      id: Date.now().toString(),
      supplier_name: grnToCopy.supplier_name + ' (Copy)',
      items: grnToCopy.items.map(item => ({ ...item }))
    }
    
    setFormData(prev => ({
      ...prev,
      grns: [...prev.grns, newGRN]
    }))
  }

  const validateGRN = (grn: GRNEntry): string[] => {
    const errors: string[] = []
    
    if (!grn.supplier_name.trim()) errors.push('Supplier name is required')
    if (!grn.delivered_by.trim()) errors.push('Delivered by is required')
    if (!grn.received_condition.trim()) errors.push('Received condition is required')
    if (!grn.date) errors.push('Date is required')
    if (!grn.receiving_time) errors.push('Receiving time is required')
    
    if (grn.items.length === 0) {
      errors.push('At least one item is required')
    } else {
      grn.items.forEach((item, index) => {
        if (!item.item.trim()) errors.push(`Item ${index + 1}: Item name is required`)
        if (item.quantity_pieces <= 0) errors.push(`Item ${index + 1}: Quantity pieces must be greater than 0`)
        if (item.quantity_kg <= 0) errors.push(`Item ${index + 1}: Weight must be greater than 0`)
      })
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      // Validate all GRNs
      const validationErrors: string[] = []
      formData.grns.forEach((grn, index) => {
        const errors = validateGRN(grn)
        if (errors.length > 0) {
          validationErrors.push(`GRN ${index + 1}: ${errors.join(', ')}`)
        }
      })

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'))
      }

      // Create all GRNs
      const createdGRNs: any[] = []
      
      for (const grnData of formData.grns) {
        // Create GRN
        const { data: grnResult, error: grnError } = await supabase
          .from('grn')
          .insert([{
            supplier_name: grnData.supplier_name,
            delivered_by: grnData.delivered_by,
            received_condition: grnData.received_condition,
            date: grnData.date,
            receiving_time: grnData.receiving_time,
            created_by: user.id,
            status: 'completed'
          }])
          .select()
          .single()

        if (grnError) throw grnError

        // Insert GRN items
        const { error: itemsError } = await supabase
          .from('grn_items')
          .insert(
            grnData.items.map(item => ({
              grn_id: grnResult.id,
              item: item.item,
              category: item.category,
              quantity_pieces: item.quantity_pieces,
              quantity_kg: item.quantity_kg,
              price: item.price
            }))
          )

        if (itemsError) throw itemsError

        createdGRNs.push(grnResult)
      }

      setCreatedGRNs(createdGRNs)
      setShowSuccess(true)
      
      toast({
        title: "Success",
        description: `${createdGRNs.length} GRN${createdGRNs.length !== 1 ? 's' : ''} created successfully`,
      })
    } catch (error: any) {
      console.error('Error creating bulk GRNs:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create GRNs",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      grns: [{
        id: '1',
        supplier_name: '',
        delivered_by: '',
        received_condition: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        receiving_time: format(new Date(), 'HH:mm'),
        items: [{ item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
      }]
    })
    setShowSuccess(false)
    setCreatedGRNs([])
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  if (showSuccess && createdGRNs.length > 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            className="h-12 sm:h-16 border-primary text-primary hover:bg-primary/10 w-full"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Bulk Create GRN
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Bulk GRN Creation Complete
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <CheckCircle className="h-5 w-5" />
                {createdGRNs.length} GRN{createdGRNs.length !== 1 ? 's' : ''} Created Successfully!
              </div>
              <p className="text-green-700 text-sm mt-1">
                All GRNs have been created and are ready for use.
              </p>
            </div>

            {/* Created GRNs List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Created GRNs</h3>
              <div className="space-y-2">
                {createdGRNs.map((grn, index) => (
                  <Card key={grn.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">GRN #{grn.grn_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {grn.supplier_name} • {format(new Date(grn.date), 'dd/MM/yyyy')} • {grn.receiving_time}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Created
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Create More GRNs
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="h-12 sm:h-16 border-primary text-primary hover:bg-primary/10 w-full"
          size="lg"
        >
          <FileText className="mr-2 h-5 w-5" />
          Bulk Create GRN
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[1000px] p-3 sm:p-6 h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-2">
          <DialogTitle className="text-lg sm:text-xl">Bulk Create Goods Received Notes</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GRN Entries */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-muted-foreground">
                GRN Entries ({formData.grns.length})
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addGRN}
                className="h-8 px-3 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add GRN
              </Button>
            </div>

            <div className="space-y-4">
              {formData.grns.map((grn, grnIndex) => (
                <Card key={grn.id} className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        GRN {grnIndex + 1}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyGRN(grnIndex)}
                          title="Copy GRN"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {formData.grns.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeGRN(grnIndex)}
                            title="Remove GRN"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Information */}
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`supplier_${grnIndex}`}>Supplier Name</Label>
                          <Input
                            id={`supplier_${grnIndex}`}
                            value={grn.supplier_name}
                            onChange={(e) => handleGRNChange(grnIndex, 'supplier_name', e.target.value)}
                            className="w-full"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`delivered_${grnIndex}`}>Delivered By</Label>
                          <Input
                            id={`delivered_${grnIndex}`}
                            value={grn.delivered_by}
                            onChange={(e) => handleGRNChange(grnIndex, 'delivered_by', e.target.value)}
                            className="w-full"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`condition_${grnIndex}`}>Condition</Label>
                          <Input
                            id={`condition_${grnIndex}`}
                            value={grn.received_condition}
                            onChange={(e) => handleGRNChange(grnIndex, 'received_condition', e.target.value)}
                            className="w-full"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`date_${grnIndex}`}>Date</Label>
                          <Input
                            id={`date_${grnIndex}`}
                            type="date"
                            value={grn.date}
                            onChange={(e) => handleGRNChange(grnIndex, 'date', e.target.value)}
                            className="w-full"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`time_${grnIndex}`}>Time</Label>
                          <Input
                            id={`time_${grnIndex}`}
                            type="time"
                            value={grn.receiving_time}
                            onChange={(e) => handleGRNChange(grnIndex, 'receiving_time', e.target.value)}
                            className="w-full"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Items ({grn.items.length})
                        </h4>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(grnIndex)}
                          className="h-8 px-2 text-xs"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {grn.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex} 
                            className="bg-muted/30 rounded-lg p-3 space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <h5 className="text-sm font-medium">Item {itemIndex + 1}</h5>
                              {grn.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeItem(grnIndex, itemIndex)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label>Item Name</Label>
                                <Input
                                  value={item.item}
                                  onChange={(e) => handleItemChange(grnIndex, itemIndex, 'item', e.target.value)}
                                  className="w-full"
                                  required
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Category</Label>
                                <Select
                                  value={item.category}
                                  onValueChange={(value) => handleItemChange(grnIndex, itemIndex, 'category', value)}
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

                              <div className="space-y-1.5">
                                <Label>Pieces</Label>
                                <Input
                                  type="number"
                                  value={item.quantity_pieces}
                                  onChange={(e) => handleItemChange(grnIndex, itemIndex, 'quantity_pieces', parseInt(e.target.value) || 0)}
                                  className="w-full"
                                  required
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Weight (kg)</Label>
                                <Input
                                  type="number"
                                  value={item.quantity_kg}
                                  onChange={(e) => handleItemChange(grnIndex, itemIndex, 'quantity_kg', parseFloat(e.target.value) || 0)}
                                  className="w-full"
                                  required
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Price (optional)</Label>
                                <Input
                                  type="number"
                                  value={item.price || ''}
                                  onChange={(e) => handleItemChange(grnIndex, itemIndex, 'price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full"
                                  placeholder="Enter price (optional)"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating {formData.grns.length} GRN{formData.grns.length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Create {formData.grns.length} GRN{formData.grns.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
