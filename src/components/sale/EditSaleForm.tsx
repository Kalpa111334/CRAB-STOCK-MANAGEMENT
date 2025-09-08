import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sale } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import { salesService } from '@/services/sales.service'

interface EditSaleFormProps {
  sale: Sale
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSaleUpdated: () => void
}

export const EditSaleForm: React.FC<EditSaleFormProps> = ({
  sale,
  isOpen,
  onOpenChange,
  onSaleUpdated
}) => {
  const [formData, setFormData] = useState<Partial<Sale>>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    payment_method: '',
    notes: '',
    total_amount: 0,
    status: 'pending'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (sale) {
      setFormData({
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone || '',
        customer_email: sale.customer_email || '',
        payment_method: sale.payment_method,
        notes: sale.notes || '',
        total_amount: sale.total_amount,
        status: sale.status
      })
    }
  }, [sale])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handlePaymentMethodChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      payment_method: value
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.customer_name || !formData.payment_method) {
        toast({
          title: "Validation Error",
          description: "Customer Name and Payment Method are required.",
          variant: "destructive"
        })
        return
      }

      // Update sale
      await salesService.updateSale(sale.id, formData)

      toast({
        title: "Success",
        description: "Sale updated successfully",
        variant: "default"
      })

      onSaleUpdated()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sale. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Sale - {sale.sale_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer_name" className="text-right">
              Customer Name *
            </Label>
            <Input 
              id="customer_name" 
              placeholder="Enter customer name" 
              className="col-span-3"
              value={formData.customer_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer_phone" className="text-right">
              Phone
            </Label>
            <Input 
              id="customer_phone" 
              placeholder="Customer phone number" 
              className="col-span-3"
              value={formData.customer_phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer_email" className="text-right">
              Email
            </Label>
            <Input 
              id="customer_email" 
              placeholder="Customer email" 
              className="col-span-3"
              value={formData.customer_email}
              onChange={handleInputChange}
              type="email"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_amount" className="text-right">
              Total Amount *
            </Label>
            <Input 
              id="total_amount" 
              placeholder="Enter total amount" 
              className="col-span-3"
              value={formData.total_amount}
              onChange={handleInputChange}
              type="number"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_method" className="text-right">
              Payment Method *
            </Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={handlePaymentMethodChange}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status *
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={handleStatusChange}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input 
              id="notes" 
              placeholder="Additional notes" 
              className="col-span-3"
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 