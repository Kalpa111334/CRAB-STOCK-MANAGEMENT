import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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

interface BoxInfo {
  box_number: string
  category: string
  weight_kg: number
  supplier: string
  health_status: string
  male_count: number
  female_count: number
  date: string
}

export const DeadCrabEntryDialog: React.FC<DeadCrabEntryDialogProps> = ({
  trigger,
  selectedBox,
  onSubmit,
}) => {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [boxInfo, setBoxInfo] = useState<BoxInfo | null>(null)
  const [loadingBoxInfo, setLoadingBoxInfo] = useState(false)
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

  // Watch for box number changes
  const watchedBoxNumber = form.watch('box_number')

  // Fetch box information when box number changes
  useEffect(() => {
    if (watchedBoxNumber && watchedBoxNumber.length > 0) {
      fetchBoxInfo(watchedBoxNumber)
    } else {
      setBoxInfo(null)
    }
  }, [watchedBoxNumber])

  const fetchBoxInfo = async (boxNumber: string) => {
    setLoadingBoxInfo(true)
    try {
      const { data, error } = await supabase
        .from('crab_entries')
        .select('*')
        .eq('box_number', boxNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setBoxInfo(null)
          return
        }
        throw error
      }

      setBoxInfo(data)
      
      // Auto-fill category if box info is found
      if (data && data.category) {
        form.setValue('category', data.category as any)
      }
    } catch (error) {
      console.error('Error fetching box info:', error)
      setBoxInfo(null)
    } finally {
      setLoadingBoxInfo(false)
    }
  }

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
            {/* Box Information Display */}
            {loadingBoxInfo && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading box information...</span>
              </div>
            )}

            {boxInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Box {boxInfo.box_number} Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="secondary" className="ml-1">{boxInfo.category}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-1 font-medium">{boxInfo.weight_kg} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="ml-1 font-medium">{boxInfo.supplier}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Pieces:</span>
                      <span className="ml-1 font-medium">{boxInfo.male_count + boxInfo.female_count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Health Status:</span>
                      <Badge 
                        variant={boxInfo.health_status === 'healthy' ? 'default' : 'destructive'}
                        className="ml-1"
                      >
                        {boxInfo.health_status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Added:</span>
                      <span className="ml-1 font-medium">{new Date(boxInfo.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning Message */}
            {boxInfo && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 mb-1">Important Notice</h4>
                    <p className="text-sm text-orange-700">
                      Recording a dead crab will <strong>permanently remove</strong> the crab entry from box {boxInfo.box_number}. 
                      The box will become empty and the crabs will no longer appear in stock calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message for Empty Box */}
            {watchedBoxNumber && !loadingBoxInfo && !boxInfo && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">Box Not Found</h4>
                    <p className="text-sm text-red-700">
                      Box {watchedBoxNumber} is empty or does not exist. Please ensure the box contains crabs before recording a dead crab.
                    </p>
                  </div>
                </div>
              </div>
            )}
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !boxInfo || loadingBoxInfo}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Dead Crab & Empty Box'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 