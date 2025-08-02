import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CrabEntry } from '@/hooks/use-crab-entries'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'

const crabStatusOptions = [
  'Without one claw',
  'Without two claw',
  'Without one leg',
  'Without two leg',
  'Without three legs',
  'Without four legs',
  'Shell damage'
] as const

const formSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  box_number: z.string().min(1, 'Box number is required'),
  weight_kg: z.any(),
  weight_g: z.any(),
  category: z.enum(['Boil', 'Large', 'XL', 'XXL', 'Jumbo']),
  male_count: z.number().min(0, 'Male count must be 0 or greater'),
  female_count: z.number().min(0, 'Female count must be 0 or greater'),
  crab_status: z.array(z.enum(crabStatusOptions)).optional(),
  health_status: z.enum(['healthy', 'damaged']),
  damaged_details: z.string().optional(),
  report_type: z.enum(['TSF', 'Dutch_Trails'])
})

type FormData = z.infer<typeof formSchema>

interface Props {
  onSubmit: (data: Omit<CrabEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  trigger?: React.ReactNode
}

export function CrabEntryDialog({ onSubmit, trigger }: Props) {
  const { user } = useAuth()
  const sweetAlert = useSweetAlert()
  const { canAddCrab } = usePermissions()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
              date: '',
      supplier: '',
      box_number: '',
      weight_kg: 0,
      weight_g: 0,
      category: 'Large',
      male_count: 0,
      female_count: 0,
      crab_status: [],
      health_status: 'healthy',
      damaged_details: '',
      report_type: 'TSF'
    }
  })

  const handleSubmit = async (data: FormData) => {
    if (!user) {
      sweetAlert.error('You must be logged in to add entries')
      return
    }

    if (!canAddCrab) {
      toast({
        title: "Error",
        description: "You do not have permission to add crab entries",
        variant: "destructive"
      })
      return
    }

    try {
      const loadingAlert = sweetAlert.loading('Adding new crab entry...')
      await onSubmit({
        date: data.date, // Use the selected date directly
        supplier: data.supplier,
        box_number: data.box_number,
        weight_kg: Number(data.weight_g) / 1000, // Store exact weight without any rounding
        category: data.category,
        male_count: data.male_count,
        female_count: data.female_count,
        crab_status: data.crab_status || null,
        health_status: data.health_status,
        damaged_details: data.damaged_details,
        report_type: data.report_type,
        created_by: user.id
      })
      loadingAlert.close()
      sweetAlert.success('Crab entry added successfully')
      form.reset()
    } catch (error) {
      sweetAlert.error('Failed to add crab entry')
      console.error('Error adding entry:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button>Add New Entry</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Crab Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="box_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (g)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter weight in grams"
                        {...field}
                        onChange={e => {
                          const gValue = e.target.value;
                          field.onChange(gValue);
                          // Convert to kg without validation
                          const kgValue = gValue ? (parseFloat(gValue) / 1000).toString() : '0';
                          form.setValue('weight_kg', kgValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        readOnly
                        disabled
                        value={field.value ? field.value.toString().replace(/\.?0+$/, '') : '0'}
                        placeholder="Converted to kg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['Boil', 'Large', 'XL', 'XXL', 'Jumbo'].map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="male_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Male Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="female_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Female Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="health_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select health status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('health_status') === 'damaged' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="crab_status"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Damage Details</FormLabel>
                      </div>
                      {crabStatusOptions.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="crab_status"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="damaged_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="report_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TSF">TSF</SelectItem>
                      <SelectItem value="Dutch_Trails">Dutch Trails</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 