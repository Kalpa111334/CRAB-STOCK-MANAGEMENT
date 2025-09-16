import { StockGrid } from '@/components/stock/StockGrid'
import { PermanentDeleteCrabDialog } from '@/components/crab/PermanentDeleteCrabDialog'
import { BulkDeleteCrabDialog } from '@/components/crab/BulkDeleteCrabDialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

const Stock = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Stock Overview</h1>
          <p className="text-muted-foreground">Complete inventory of crab stock</p>
        </div>
        <div className="flex gap-2">
          <BulkDeleteCrabDialog
            onSuccess={() => {
              // Refresh the page after deletion
              window.location.reload()
            }}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Bulk Delete
              </Button>
            }
          />
          <PermanentDeleteCrabDialog
            onSuccess={() => {
              // Refresh the page after deletion
              window.location.reload()
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Single Delete
              </Button>
            }
          />
        </div>
      </div>
      <StockGrid />
    </div>
  )
}

export default Stock 