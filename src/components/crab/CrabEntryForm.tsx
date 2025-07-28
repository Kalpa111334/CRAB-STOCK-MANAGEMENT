import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const crabCategories = ['Boil', 'Large', 'XL', 'XXL', 'Jumbo'] as const
const crabStatuses = [
  'Without one claw',
  'Without two claw', 
  'Without one leg',
  'Without two leg',
  'Without three legs',
  'Without four legs',
  'Shell damage'
] as const
const reportTypes = ['TSF', 'Dutch_Trails'] as const

const crabEntrySchema = z.object({
  date: z.string(),
  supplier: z.string().min(1, 'Supplier is required'),
  box_number: z.string().min(1, 'Box number is required'),
  weight_kg: z.coerce.number().positive('Weight must be positive'),
  category: z.enum(crabCategories),
  male_count: z.coerce.number().min(0),
  female_count: z.coerce.number().min(0),
  crab_status: z.array(z.enum(crabStatuses)),
  health_status: z.enum(['healthy', 'damaged']),
  damaged_details: z.string().optional(),
  report_type: z.enum(reportTypes)
})

type CrabEntryFormData = z.infer<typeof crabEntrySchema>

interface CrabEntryFormProps {
  onSuccess?: () => void
  initialData?: Partial<CrabEntryFormData>
}

export const CrabEntryForm: React.FC<CrabEntryFormProps> = ({ onSuccess, initialData }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialData?.crab_status || [])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CrabEntryFormData>({
    resolver: zodResolver(crabEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      male_count: 0,
      female_count: 0,
      health_status: 'healthy',
      report_type: 'TSF',
      ...initialData
    }
  })

  const healthStatus = watch('health_status')

  const onSubmit = async (data: CrabEntryFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const insertData = {
        date: data.date,
        supplier: data.supplier,
        box_number: data.box_number,
        weight_kg: data.weight_kg,
        category: data.category,
        male_count: data.male_count,
        female_count: data.female_count,
        health_status: data.health_status,
        damaged_details: data.damaged_details,
        report_type: data.report_type,
        crab_status: selectedStatuses as any,
        created_by: user.id
      }

      const { error } = await supabase
        .from('crab_entries')
        .insert([insertData])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Crab entry added successfully',
      })
      
      reset()
      setSelectedStatuses([])
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status])
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Add Crab Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                {...register('supplier')}
                className={errors.supplier ? 'border-destructive' : ''}
              />
              {errors.supplier && <p className="text-sm text-destructive mt-1">{errors.supplier.message}</p>}
            </div>

            <div>
              <Label htmlFor="box_number">Box Number</Label>
              <Input
                id="box_number"
                {...register('box_number')}
                className={errors.box_number ? 'border-destructive' : ''}
              />
              {errors.box_number && <p className="text-sm text-destructive mt-1">{errors.box_number.message}</p>}
            </div>

            <div>
              <Label htmlFor="weight_kg">Weight (KG)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                {...register('weight_kg')}
                className={errors.weight_kg ? 'border-destructive' : ''}
              />
              {errors.weight_kg && <p className="text-sm text-destructive mt-1">{errors.weight_kg.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('category', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {crabCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="report_type">Report Type</Label>
              <Select onValueChange={(value) => setValue('report_type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'TSF' ? 'Tropical Sel-Fish' : 'Dutch Trails'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.report_type && <p className="text-sm text-destructive mt-1">{errors.report_type.message}</p>}
            </div>

            <div>
              <Label htmlFor="male_count">Male Count</Label>
              <Input
                id="male_count"
                type="number"
                {...register('male_count')}
                className={errors.male_count ? 'border-destructive' : ''}
              />
              {errors.male_count && <p className="text-sm text-destructive mt-1">{errors.male_count.message}</p>}
            </div>

            <div>
              <Label htmlFor="female_count">Female Count</Label>
              <Input
                id="female_count"
                type="number"
                {...register('female_count')}
                className={errors.female_count ? 'border-destructive' : ''}
              />
              {errors.female_count && <p className="text-sm text-destructive mt-1">{errors.female_count.message}</p>}
            </div>
          </div>

          <div>
            <Label>Health Status</Label>
            <Select onValueChange={(value) => setValue('health_status', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select health status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Crab Status (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {crabStatuses.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                  />
                  <Label htmlFor={status} className="text-sm font-normal">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {healthStatus === 'damaged' && (
            <div>
              <Label htmlFor="damaged_details">Damage Details</Label>
              <Textarea
                id="damaged_details"
                {...register('damaged_details')}
                placeholder="Describe the damage..."
                rows={3}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Crab Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}