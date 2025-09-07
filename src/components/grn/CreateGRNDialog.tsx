import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, Loader2, Trash2, Download, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import html2canvas from 'html2canvas'

type CrabCategory = 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'

interface GRNItem {
  item: string
  category: CrabCategory
  quantity_pieces: number
  quantity_kg: number
  price?: number
}

interface GRNFormData {
  supplier_name: string
  delivered_by: string
  received_condition: string
  date: string
  receiving_time: string
  items: GRNItem[]
}

export const CreateGRNDialog = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<GRNFormData>({
    supplier_name: '',
    delivered_by: '',
    received_condition: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    receiving_time: format(new Date(), 'HH:mm'),
    items: [{ item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [grnData, setGrnData] = useState<any>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item: '', category: 'Large', quantity_pieces: 0, quantity_kg: 0, price: undefined }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return // Keep at least one item
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const downloadGRN = async () => {
    const invoiceElement = document.getElementById('grn-invoice')
    if (!invoiceElement || !grnData) return

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `GRN-${grnData.grn_number}.png`
      link.href = dataUrl
      link.click()

      toast({
        title: "Success",
        description: "GRN invoice downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading GRN:', error)
      toast({
        title: "Error",
        description: "Failed to download GRN invoice",
        variant: "destructive"
      })
    }
  }

  const shareGRN = async () => {
    const invoiceElement = document.getElementById('grn-invoice')
    if (!invoiceElement || !grnData) return

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      })

      const dataUrl = canvas.toDataURL('image/png')
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `GRN-${grnData.grn_number}.png`, { type: 'image/png' })

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `GRN-${grnData.grn_number}`,
          text: 'Goods Received Note'
        })
      } else {
        // Fallback to WhatsApp sharing
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Goods Received Note')}`
        window.open(whatsappUrl)
      }

      toast({
        title: "Success",
        description: "GRN invoice shared successfully",
      })
    } catch (error) {
      console.error('Error sharing GRN:', error)
      toast({
        title: "Error",
        description: "Failed to share GRN invoice",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      // Create GRN
      const { data: grnResult, error: grnError } = await supabase
        .from('grn')
        .insert([{
          supplier_name: formData.supplier_name,
          delivered_by: formData.delivered_by,
          received_condition: formData.received_condition,
          date: formData.date,
          receiving_time: formData.receiving_time,
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
          formData.items.map(item => ({
            grn_id: grnResult.id,
            item: item.item,
            category: item.category,
            quantity_pieces: item.quantity_pieces,
            quantity_kg: item.quantity_kg,
            price: item.price
          }))
        )

      if (itemsError) throw itemsError

      setGrnData(grnResult)
      setShowInvoice(true) // Show invoice after successful creation
      toast({
        title: "Success",
        description: `GRN ${grnResult.grn_number} created successfully`,
      })
      setOpen(false)
    } catch (error: any) {
      console.error('Error creating GRN:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create GRN",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
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
          Create GRN
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[85vw] max-w-[700px] p-3 sm:p-6 h-[90vh] sm:h-auto overflow-y-auto">
        {!showInvoice ? (
          <>
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-2">
              <DialogTitle className="text-lg sm:text-xl">Create Goods Received Note</DialogTitle>
        </DialogHeader>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h3>
                  
                  <div className="space-y-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="delivered_by">Delivered By</Label>
                      <Input
                        id="delivered_by"
                        name="delivered_by"
                        value={formData.delivered_by}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="received_condition">Condition</Label>
                      <Input
                        id="received_condition"
                        name="received_condition"
                        value={formData.received_condition}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full"
                required
              />
            </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="receiving_time">Time</Label>
              <Input
                          id="receiving_time"
                          name="receiving_time"
                          type="time"
                          value={formData.receiving_time}
                onChange={handleInputChange}
                          className="w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addItem}
                      className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      <Plus className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Add Item</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div 
                        key={index} 
                        className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Item {index + 1}</h4>
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="grid gap-1.5">
                            <Label>Item Name</Label>
                            <Input
                              value={item.item}
                              onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                              className="w-full"
                required
              />
            </div>

                          <div className="grid gap-1.5">
                            <Label>Category</Label>
              <Select
                              value={item.category}
                              onValueChange={(value) => handleItemChange(index, 'category', value)}
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

                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <Label>Pieces</Label>
              <Input
                type="number"
                                value={item.quantity_pieces}
                                onChange={(e) => handleItemChange(index, 'quantity_pieces', parseInt(e.target.value) || 0)}
                                className="w-full"
                                min="0"
                required
              />
            </div>

                            <div className="grid gap-1.5">
                              <Label>Weight (kg)</Label>
              <Input
                type="number"
                                value={item.quantity_kg}
                                onChange={(e) => handleItemChange(index, 'quantity_kg', parseFloat(e.target.value) || 0)}
                                className="w-full"
                min="0"
                required
              />
            </div>
            </div>

                          <div className="grid gap-1.5">
                            <Label>Price (optional)</Label>
              <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full"
                              min="0"
                              placeholder="Enter price (optional)"
              />
            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>

              <Button 
                type="submit" 
                className="w-full mt-4 h-12 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating GRN...
                  </>
                ) : (
                  'Create GRN'
                )}
              </Button>
          </form>
          </>
        ) : (
          <>
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-2 border-b">
              <DialogTitle className="text-lg sm:text-xl">Goods Received Note</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div id="grn-invoice" className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-4">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold">Goods Received Note</h2>
                  <p className="text-sm text-muted-foreground">GRN #{grnData?.grn_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Date:</strong> {format(new Date(grnData?.date || ''), 'dd/MM/yyyy')}</p>
                    <p><strong>Time:</strong> {grnData?.receiving_time}</p>
                    <p><strong>Supplier:</strong> {grnData?.supplier_name}</p>
                </div>
                <div>
                    <p><strong>Delivered By:</strong> {grnData?.delivered_by}</p>
                    <p><strong>Condition:</strong> {grnData?.received_condition}</p>
                  </div>
              </div>

                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="p-2">Item</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Pieces</th>
                          <th className="p-2 text-right">Weight (kg)</th>
                          {formData.items.some(item => item.price) && (
                            <th className="p-2 text-right">Price</th>
                          )}
                  </tr>
                </thead>
                <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.item}</td>
                            <td className="p-2">{item.category}</td>
                            <td className="p-2 text-right">{item.quantity_pieces}</td>
                            <td className="p-2 text-right">{item.quantity_kg.toString()}</td>
                            {formData.items.some(item => item.price) && (
                              <td className="p-2 text-right">
                                {item.price ? `LKR ${item.price.toFixed(2)}` : '-'}
                              </td>
                            )}
                  </tr>
                        ))}
                </tbody>
              </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="mt-16 pt-2 border-t border-dashed">
                      Received By
                    </div>
                </div>
                <div className="text-center">
                    <div className="mt-16 pt-2 border-t border-dashed">
                      Authorized By
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={downloadGRN}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={shareGRN}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
            </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 