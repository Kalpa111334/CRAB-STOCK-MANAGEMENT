import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Share2, CheckCircle, Package, Calendar, MapPin, FileText, Trash2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useToast } from '@/hooks/use-toast'

interface ReleaseItem {
  boxNumber?: string
  category: string
  quantity_kg: number
  pieces_count: number
}

interface ReleaseConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  releaseData: {
    items: ReleaseItem[]
    destination: string
    release_date: string
    notes?: string
    total_weight: number
    total_pieces: number
  }
}

export const ReleaseConfirmationDialog: React.FC<ReleaseConfirmationDialogProps> = ({
  isOpen,
  onClose,
  releaseData
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const generateInvoice = async () => {
    if (!invoiceRef.current) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: 1000
      })

      // Convert canvas to PNG
      const pngDataUrl = canvas.toDataURL('image/png')
      
      // Create download link
      const link = document.createElement('a')
      link.download = `crab-release-${releaseData.release_date}-${Date.now()}.png`
      link.href = pngDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const shareViaWhatsApp = () => {
    const message = `🦀 *Crab Stock Release Confirmation*\n\n` +
      `📅 Date: ${releaseData.release_date}\n` +
      `📍 Destination: ${releaseData.destination}\n` +
      `📦 Total Boxes: ${releaseData.items.length}\n` +
      `⚖️ Total Weight: ${releaseData.total_weight} kg\n` +
      `🔢 Total Pieces: ${releaseData.total_pieces}\n\n` +
      `📋 Items Released:\n` +
      releaseData.items.map(item => 
        `• ${item.boxNumber ? `Box ${item.boxNumber}` : 'General'}: ${item.category} - ${item.quantity_kg}kg (${item.pieces_count} pieces)`
      ).join('\n') +
      (releaseData.notes ? `\n\n📝 Notes: ${releaseData.notes}` : '') +
      `\n\n🗑️ Boxes Emptied: All ${releaseData.items.length} released boxes have been emptied and removed from stock.\n\n` +
      `✅ Release completed successfully!`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Boil': 'bg-blue-100 text-blue-800',
      'Large': 'bg-green-100 text-green-800',
      'XL': 'bg-yellow-100 text-yellow-800',
      'XXL': 'bg-orange-100 text-orange-800',
      'Jumbo': 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Release Confirmation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <CheckCircle className="h-5 w-5" />
              Stock Released Successfully!
            </div>
            <p className="text-green-700 text-sm mt-1">
              {releaseData.items.length} box{releaseData.items.length !== 1 ? 'es' : ''} released to {releaseData.destination}
            </p>
          </div>

          {/* Box Emptying Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Trash2 className="h-5 w-5" />
              Boxes Emptied
            </div>
            <p className="text-blue-700 text-sm mt-1">
              All {releaseData.items.length} released box{releaseData.items.length !== 1 ? 'es' : ''} have been emptied and removed from stock calculations.
            </p>
          </div>

          {/* Invoice Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Release Invoice</h3>
              <div className="flex gap-2">
                <Button
                  onClick={generateInvoice}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Download PNG'}
                </Button>
                <Button
                  onClick={shareViaWhatsApp}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share WhatsApp
                </Button>
              </div>
            </div>

            {/* Invoice Content */}
            <div 
              ref={invoiceRef}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 w-[800px] min-h-[600px]"
            >
              {/* Invoice Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Crab Stock Guardian</h1>
                <p className="text-gray-600">Stock Release Invoice</p>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {releaseData.release_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Destination: {releaseData.destination}</span>
                  </div>
                </div>
              </div>

              {/* Release Summary */}
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{releaseData.items.length}</div>
                  <div className="text-sm text-gray-600">Boxes Released</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{releaseData.total_weight} kg</div>
                  <div className="text-sm text-gray-600">Total Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{releaseData.total_pieces}</div>
                  <div className="text-sm text-gray-600">Total Pieces</div>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Released Items
                </h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Box #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pieces</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {releaseData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.boxNumber ? `#${item.boxNumber}` : 'General'}
                          </td>
                          <td className="px-4 py-2">
                            <Badge className={getCategoryColor(item.category)}>
                              {item.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {item.quantity_kg}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {item.pieces_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {releaseData.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {releaseData.notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-xs text-gray-500">
                <p>Generated on {new Date().toLocaleString()}</p>
                <p className="mt-1">Crab Stock Guardian System - Quality Control Dashboard</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
