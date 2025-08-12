import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'

const deadCrabSchema = z.object({
  box_number: z.string().min(1, 'Box number is required'),
  category: z.enum(['Boil', 'Large', 'XL', 'XXL', 'Jumbo'], {
    required_error: 'Please select a category',
  }),
  weight_kg: z.number().min(0.001, 'Weight must be greater than 0'),
  time: z.string().min(1, 'Time is required'),
  cause_of_death: z.string().min(1, 'Cause of death is required'),
  notes: z.string().optional(),
})

type DeadCrabFormData = z.infer<typeof deadCrabSchema>

interface DeadCrabEntryDialogProps {
  trigger: React.ReactNode
  selectedBox?: string
  onSubmit: (data: DeadCrabFormData) => Promise<void>
}

export const DeadCrabEntryDialog: React.FC<DeadCrabEntryDialogProps> = ({
  trigger,
  selectedBox,
  onSubmit,
}) => {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { canRecordDeadCrab } = usePermissions()
  const { toast } = useToast()

  const form = useForm<DeadCrabFormData>({
    resolver: zodResolver(deadCrabSchema),
    defaultValues: {
      box_number: selectedBox || '',
      category: undefined,
      weight_kg: 0,
      time: format(new Date(), 'HH:mm'),
      cause_of_death: '',
      notes: '',
    },
  })

  const handleSubmit = async (data: DeadCrabFormData) => {
    if (!canRecordDeadCrab) {
      toast({
        title: "Error",
        description: "You do not have permission to record dead crabs",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(data)
      form.reset()
      setOpen(false)
      toast({
        title: "Success",
        description: "Dead crab recorded successfully"
      })
    } catch (error: any) {
      console.error('Error submitting dead crab entry:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to record dead crab",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Dead Crab</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="box_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter box number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Boil">Boil</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                      <SelectItem value="Jumbo">Jumbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00"
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cause_of_death"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cause of Death</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter cause of death" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any additional notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Dead Crab'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 