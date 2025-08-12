import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sale } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { salesService } from '@/services/sales.service'

export const NewSaleForm: React.FC = () => {
  const [sale, setSale] = useState<Partial<Sale>>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    payment_method: '',
    notes: '',
    total_amount: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setSale(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handlePaymentMethodChange = (value: string) => {
    setSale(prev => ({
      ...prev,
      payment_method: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!sale.customer_name || !sale.payment_method) {
        toast({
          title: "Validation Error",
          description: "Customer Name and Payment Method are required.",
          variant: "destructive"
        })
        return
      }

      // Create sale
      const newSale = await salesService.createSale(sale)

      toast({
        title: "Success",
        description: `Sale ${newSale.sale_number} has been created successfully.`,
        variant: "default"
      })

      // Reset form
      setSale({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        payment_method: '',
        notes: '',
        total_amount: 0
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sale. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>+ New Sale</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="relative">
          <DialogTitle>New Sale</DialogTitle>
          <DialogClose className="absolute right-0 top-0">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
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
              value={sale.customer_name}
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
              value={sale.customer_phone}
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
              value={sale.customer_email}
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
              value={sale.total_amount}
              onChange={handleInputChange}
              type="number"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_method" className="text-right">
              Payment Method *
            </Label>
            <Select 
              value={sale.payment_method} 
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
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input 
              id="notes" 
              placeholder="Additional notes" 
              className="col-span-3"
              value={sale.notes}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 