import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useCrabDeletion } from '@/hooks/use-crab-deletion'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Search, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  box_number: z.string().min(1, 'Box number is required'),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function PermanentDeleteCrabDialog({ trigger, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [foundCrab, setFoundCrab] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const { canDeleteCrab } = usePermissions()
  const { toast } = useToast()
  const { loading, findCrabByBoxNumber, permanentlyDeleteCrab } = useCrabDeletion()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      box_number: '',
    }
  })

  const handleSearch = async (data: FormData) => {
    setSearching(true)
    try {
      const crab = await findCrabByBoxNumber(data.box_number)
      setFoundCrab(crab)
      
      if (!crab) {
        toast({
          title: "Not Found",
          description: `No crab entry found with box number: ${data.box_number}`,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search for crab entry",
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async () => {
    if (!foundCrab) return

    try {
      const result = await permanentlyDeleteCrab(foundCrab.box_number)
      
      if (result.success) {
        setOpen(false)
        form.reset()
        setFoundCrab(null)
        onSuccess?.()
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleClose = () => {
    setOpen(false)
    form.reset()
    setFoundCrab(null)
  }

  if (!canDeleteCrab) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Crab
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Permanently Delete Crab Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              Warning
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This action will permanently delete the crab entry from the database. 
              This cannot be undone and will affect stock calculations.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="box_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter box number to search..." 
                        {...field} 
                        disabled={searching}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={searching}
                className="w-full"
              >
                {searching ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Crab Entry
                  </>
                )}
              </Button>
            </form>
          </Form>

          {foundCrab && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg">Found Crab Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Box Number</Label>
                    <p className="font-medium">{foundCrab.box_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{foundCrab.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Weight</Label>
                    <p className="font-medium">{foundCrab.weight_kg} kg</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{foundCrab.supplier}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Health Status</Label>
                    <Badge variant={foundCrab.health_status === 'healthy' ? 'default' : 'destructive'}>
                      {foundCrab.health_status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Pieces</Label>
                    <p className="font-medium">{foundCrab.male_count + foundCrab.female_count}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Permanently Delete
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
