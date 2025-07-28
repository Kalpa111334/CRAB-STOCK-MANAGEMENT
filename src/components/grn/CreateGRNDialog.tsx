import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import html2canvas from 'html2canvas'

type CrabCategory = 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'

interface GRNFormData {
  supplier_name: string
  item: string
  category: CrabCategory
  quantity: number
  price: number
  delivered_by: string
  received_condition: string
  date: string
  receiving_time: string
}

export const CreateGRNDialog = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<GRNFormData>({
    supplier_name: '',
    item: '',
    category: 'Large',
    quantity: 0,
    price: 0,
    delivered_by: '',
    received_condition: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    receiving_time: format(new Date(), 'HH:mm')
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [grnData, setGrnData] = useState<any>(null)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCategoryChange = (value: CrabCategory) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!user) {
        throw new Error('User not authenticated')
      }

      const total_value = formData.quantity * formData.price

      // Create GRN
      const { data: grnResult, error: grnError } = await supabase
        .from('grn')
        .insert([{
          supplier_name: formData.supplier_name,
          item: formData.item,
          category: formData.category,
          quantity: formData.quantity,
          price: formData.price,
          total_value: total_value,
          delivered_by: formData.delivered_by,
          received_condition: formData.received_condition,
          date: formData.date,
          receiving_time: formData.receiving_time,
          created_by: user.id,
          status: 'completed'
        }])
        .select()
        .single()

      if (grnError) {
        console.error('GRN Error:', grnError)
        throw new Error(grnError.message)
      }

      setGrnData(grnResult)
      toast({
        title: "Success",
        description: `GRN ${grnResult.grn_number} created successfully`,
      })
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

  const downloadGRN = async () => {
    if (!grnData) return

    const grnElement = document.getElementById('grn-preview')
    if (!grnElement) return

    try {
      const canvas = await html2canvas(grnElement, {
        scale: 2,
        width: 794,
        height: 1123,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `GRN-${grnData.grn_number}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error generating GRN:', error)
      toast({
        title: "Error",
        description: "Failed to generate GRN image",
        variant: "destructive"
      })
    }
  }

  const shareGRN = async () => {
    if (!grnData) return

    const grnElement = document.getElementById('grn-preview')
    if (!grnElement) return

    try {
      const canvas = await html2canvas(grnElement, {
        scale: 2,
        width: 794,
        height: 1123,
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
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Goods Received Note')}`
        window.open(whatsappUrl)
      }
    } catch (error) {
      console.error('Error sharing GRN:', error)
      toast({
        title: "Error",
        description: "Failed to share GRN",
        variant: "destructive"
      })
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Goods Received Note</DialogTitle>
        </DialogHeader>

        {!grnData ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier_name" className="text-right">Supplier Name</Label>
              <Input
                id="supplier_name"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">Item</Label>
              <Input
                id="item"
                name="item"
                value={formData.item}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="col-span-3">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                className="col-span-3"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivered_by" className="text-right">Delivered By</Label>
              <Input
                id="delivered_by"
                name="delivered_by"
                value={formData.delivered_by}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="received_condition" className="text-right">Condition</Label>
              <Input
                id="received_condition"
                name="received_condition"
                value={formData.received_condition}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receiving_time" className="text-right">Time</Label>
              <Input
                id="receiving_time"
                name="receiving_time"
                type="time"
                value={formData.receiving_time}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create GRN'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div id="grn-preview" className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-center mb-4">Goods Received Note</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>GRN Number:</strong> {grnData.grn_number}</p>
                  <p><strong>Date:</strong> {format(new Date(grnData.date), 'dd/MM/yyyy')}</p>
                  <p><strong>Time:</strong> {grnData.receiving_time}</p>
                </div>
                <div>
                  <p><strong>Supplier:</strong> {grnData.supplier_name}</p>
                  <p><strong>Delivered By:</strong> {grnData.delivered_by}</p>
                  <p><strong>Condition:</strong> {grnData.received_condition}</p>
                </div>
              </div>

              <table className="w-full mt-4 border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">{grnData.item}</td>
                    <td className="p-2">{grnData.category}</td>
                    <td className="text-right p-2">{grnData.quantity}</td>
                    <td className="text-right p-2">LKR {grnData.price.toFixed(2)}</td>
                    <td className="text-right p-2">LKR {grnData.total_value.toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right p-2"><strong>Total:</strong></td>
                    <td className="text-right p-2"><strong>LKR {grnData.total_value.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="border-t border-gray-400 mt-16 pt-2">Received By</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 mt-16 pt-2">Authorized By</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={downloadGRN}>Download PNG</Button>
              <Button onClick={shareGRN}>Share on WhatsApp</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 