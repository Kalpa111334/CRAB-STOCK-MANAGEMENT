import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { Purchase } from '@/types/database'
import { purchaseService } from '@/services/purchase.service'
import { useToast } from '@/hooks/use-toast'

interface DeletePurchaseOrderDialogProps {
  purchase: Purchase | null
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export const DeletePurchaseOrderDialog: React.FC<DeletePurchaseOrderDialogProps> = ({
  purchase,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [loading, setLoading] = useState(false)
  const [canDelete, setCanDelete] = useState<{ canDelete: boolean; reason?: string }>({ canDelete: false })
  const { toast } = useToast()

  useEffect(() => {
    const checkDeletionRules = async () => {
      if (purchase) {
        const result = await purchaseService.canDeletePurchase(purchase)
        setCanDelete(result)
      }
    }

    if (purchase && isOpen) {
      checkDeletionRules()
    }
  }, [purchase, isOpen])

  const handleDelete = async () => {
    if (!purchase || !canDelete.canDelete) return

    setLoading(true)

    try {
      await purchaseService.deletePurchase(purchase.id)

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
        variant: "default"
      })

      onDeleted()
      onClose()
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete purchase order',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!purchase) return null

  const items = purchase.items as any[] || []
  const firstItem = items[0] || {}

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Purchase Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            You are about to permanently delete this purchase order. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Purchase Order Details */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Order Number:</span>
                  <span className="text-sm">{purchase.order_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Supplier:</span>
                  <span className="text-sm">{purchase.supplier_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-sm font-semibold">LKR {purchase.total_amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={
                    purchase.status === 'completed' ? 'default' :
                    purchase.status === 'pending' ? 'secondary' :
                    'destructive'
                  }>
                    {purchase.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(purchase.created_at).toLocaleDateString()}</span>
                </div>
                {items.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Items:</span>
                    <span className="text-sm">{firstItem.quantity_kg} kg of {firstItem.category}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deletion Rules Check */}
          {!canDelete.canDelete && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Cannot Delete</h4>
                    <p className="text-sm text-yellow-700">{canDelete.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canDelete.canDelete && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">Warning</h4>
                    <p className="text-sm text-red-700">
                      This will permanently delete the purchase order and all associated data. 
                      This action cannot be undone and will affect your purchasing records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || !canDelete.canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Purchase Order
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
