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
import { Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'

const damageCrabSchema = z.object({
  box_number: z.string().optional(),
  category: z.enum(['Boil', 'Large', 'XL', 'XXL', 'Jumbo']).optional(),
  weight_kg: z.number().optional(),
  time: z.string().optional(),
  damage_type: z.string().optional(),
  damage_description: z.string().optional(),
  action_taken: z.string().optional(),
  notes: z.string().optional(),
})

type DamageCrabFormData = z.infer<typeof damageCrabSchema>

interface DamageCrabEntryDialogProps {
  trigger: React.ReactNode
  selectedBox?: string
  onSubmit: (data: DamageCrabFormData) => Promise<void>
}

export const DamageCrabEntryDialog: React.FC<DamageCrabEntryDialogProps> = ({
  trigger,
  selectedBox,
  onSubmit,
}) => {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { canRecordDeadCrab } = usePermissions() // Reuse the same permission
  const { toast } = useToast()

  const form = useForm<DamageCrabFormData>({
    resolver: zodResolver(damageCrabSchema),
    defaultValues: {
      box_number: selectedBox || '',
      category: undefined,
      weight_kg: 0,
      time: format(new Date(), 'HH:mm'),
      damage_type: '',
      damage_description: '',
      action_taken: '',
      notes: '',
    },
  })

  const handleSubmit = async (data: DamageCrabFormData) => {
    if (!canRecordDeadCrab) {
      toast({
        title: "Error",
        description: "You do not have permission to record damaged crabs",
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
        description: "Damaged crab recorded successfully"
      })
    } catch (error: any) {
      console.error('Error submitting damaged crab entry:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to record damaged crab",
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
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Record Damaged Crab</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="box_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Box Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter box number" 
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
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
                    <FormLabel className="text-sm sm:text-base">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Weight (kg)</FormLabel>
                    <FormControl>
                                             <Input
                         type="number"
                         {...field}
                         onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                         placeholder="Enter weight in kg"
                         className="h-10 sm:h-11 text-sm sm:text-base"
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
                    <FormLabel className="text-sm sm:text-base">Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="damage_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Damage Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select damage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Shell Damage">Shell Damage</SelectItem>
                      <SelectItem value="Missing Claw">Missing Claw</SelectItem>
                      <SelectItem value="Missing Leg">Missing Leg</SelectItem>
                      <SelectItem value="Physical Injury">Physical Injury</SelectItem>
                      <SelectItem value="Disease">Disease</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="damage_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Damage Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the damage in detail" 
                      className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_taken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Action Taken</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="What action was taken to address the damage?" 
                      className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                    />
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
                  <FormLabel className="text-sm sm:text-base">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter any additional notes" 
                      className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2 sm:pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-5" />
                    Record Damaged Crab
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
