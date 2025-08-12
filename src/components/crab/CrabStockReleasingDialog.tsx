import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Package, MapPin, Download, Share2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import html2canvas from 'html2canvas'

const releaseFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  boxNumber: z.string().min(1, 'Box number is required'),
  destinationType: z.enum(['local_sale', 'shipments']),
  destination: z.string().min(1, 'Destination is required'),
})

type ReleaseFormData = z.infer<typeof releaseFormSchema>

interface CrabStockReleasingDialogProps {
  trigger: React.ReactNode
}

export const CrabStockReleasingDialog: React.FC<CrabStockReleasingDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      destinationType: 'local_sale',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    }
  })

  const destinationType = watch('destinationType')

  const onSubmit = async (data: ReleaseFormData) => {
    setIsGenerating(true)
    try {
      // Generate PNG using html2canvas
      const element = document.getElementById('release-certificate')
      if (element) {
        // Wait a bit for the DOM to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            width: 794,
            height: 1123,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: 1123
          })
          
          // Ensure canvas is valid
          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas generation failed')
          }
          
          // Convert to blob for better reliability
          canvas.toBlob((blob) => {
            if (blob) {
              downloadAndSharePNG(blob, data)
            } else {
              throw new Error('Failed to create PNG blob')
            }
          }, 'image/png', 0.95)
          
        } catch (html2canvasError) {
          console.warn('html2canvas failed, trying fallback method:', html2canvasError)
          // Fallback: Generate PNG using canvas API directly
          await generatePNGFallback(data)
        }
      } else {
        throw new Error('Certificate template element not found')
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast({
        title: "Error",
        description: `Failed to generate release certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadAndSharePNG = (blob: Blob, data: ReleaseFormData) => {
    try {
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crab-release-${data.boxNumber}-${data.date}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
      
      // Share on WhatsApp
      const message = `🦀 *Crab Stock Release Certificate*\n\n` +
        `📅 Date: ${data.date}\n` +
        `⏰ Time: ${data.time}\n` +
        `📦 Box Number: ${data.boxNumber}\n` +
        `📍 Destination: ${data.destination}\n` +
        `🚚 Type: ${data.destinationType === 'local_sale' ? 'Local Sale' : 'Shipment'}\n\n` +
        `✅ Stock has been released and is ready for ${data.destinationType === 'local_sale' ? 'local sale' : 'shipment'} to ${data.destination}`

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      toast({
        title: "Success!",
        description: "Release certificate generated and shared on WhatsApp",
      })

      setIsOpen(false)
      reset()
    } catch (error) {
      console.error('Error in download and share:', error)
      throw error
    }
  }

  const generatePNGFallback = async (data: ReleaseFormData) => {
    try {
      // Create canvas manually
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas context not available')
      }
      
      // Set canvas size
      canvas.width = 794
      canvas.height = 1123
      
      // Fill background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw certificate content
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('🦀 CRAB STOCK RELEASE CERTIFICATE', canvas.width / 2, 80)
      
      // Draw release information
      ctx.font = '16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Date: ${data.date}`, 100, 150)
      ctx.fillText(`Time: ${data.time}`, 100, 180)
      ctx.fillText(`Box Number: ${data.boxNumber}`, 100, 210)
      ctx.fillText(`Type: ${data.destinationType === 'local_sale' ? 'Local Sale' : 'Shipment'}`, 100, 240)
      ctx.fillText(`Destination: ${data.destination}`, 100, 270)
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          downloadAndSharePNG(blob, data)
        } else {
          throw new Error('Failed to create PNG blob from fallback method')
        }
      }, 'image/png', 0.95)
      
    } catch (error) {
      console.error('Fallback PNG generation failed:', error)
      throw error
    }
  }

  const testPNGGeneration = async () => {
    try {
      toast({
        title: "Testing PNG Generation",
        description: "Generating test PNG...",
      })
      
      // Test with sample data
      const testData = {
        date: watch('date') || '2025-01-01',
        time: watch('time') || '12:00',
        boxNumber: watch('boxNumber') || 'TEST-001',
        destination: watch('destination') || 'Test Destination',
        destinationType: destinationType
      }
      
      await generatePNGFallback(testData)
      
      toast({
        title: "Test Successful!",
        description: "PNG generation is working correctly",
      })
      
    } catch (error) {
      console.error('Test PNG generation failed:', error)
      toast({
        title: "Test Failed",
        description: `PNG generation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Crab Stock Releasing
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                {...register('time')}
                className={errors.time ? 'border-destructive' : ''}
              />
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="boxNumber" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Box Number
              </Label>
              <Input
                id="boxNumber"
                placeholder="Enter box number"
                {...register('boxNumber')}
                className={errors.boxNumber ? 'border-destructive' : ''}
              />
              {errors.boxNumber && (
                <p className="text-sm text-destructive">{errors.boxNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationType" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination Type
              </Label>
              <Select
                value={destinationType}
                onValueChange={(value: 'local_sale' | 'shipments') => setValue('destinationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local_sale">Local Sale</SelectItem>
                  <SelectItem value="shipments">Shipments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {destinationType === 'local_sale' ? 'Local Sale Destination' : 'Shipment Country'}
              </Label>
              <Input
                id="destination"
                placeholder={destinationType === 'local_sale' ? 'Enter local sale destination' : 'Enter country name'}
                {...register('destination')}
                className={errors.destination ? 'border-destructive' : ''}
              />
              {errors.destination && (
                <p className="text-sm text-destructive">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Date:</strong> {watch('date') || 'Not set'}</p>
                  <p><strong>Time:</strong> {watch('time') || 'Not set'}</p>
                  <p><strong>Box Number:</strong> {watch('boxNumber') || 'Not set'}</p>
                  <p><strong>Type:</strong> {destinationType === 'local_sale' ? 'Local Sale' : 'Shipment'}</p>
                  <p><strong>Destination:</strong> {watch('destination') || 'Not set'}</p>
                </div>
                
                {/* Test PNG Generation */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testPNGGeneration()}
                    className="w-full"
                  >
                    🧪 Test PNG Generation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isGenerating}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Release & Download Certificate
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Hidden Certificate Template for PNG Generation */}
        <div id="release-certificate" className="hidden">
          <div style={{
            width: '794px', // A4 width in pixels at 96 DPI
            height: '1123px', // A4 height in pixels at 96 DPI
            padding: '40px',
            backgroundColor: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
                🦀 CRAB STOCK RELEASE CERTIFICATE
              </h1>
              <div style={{ height: '3px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', margin: '0 auto', width: '200px' }}></div>
            </div>

            {/* Certificate Content */}
            <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '30px' }}>
                <p style={{ marginBottom: '20px' }}>
                  This certificate confirms that the crab stock has been officially released from the quality control facility 
                  and is ready for {destinationType === 'local_sale' ? 'local sale' : 'shipment'}.
                </p>
              </div>

              {/* Release Details */}
              <div style={{ 
                border: '2px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '30px',
                backgroundColor: '#f9fafb',
                marginBottom: '30px'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
                  Release Information
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <strong style={{ color: '#374151' }}>Release Date:</strong>
                    <p style={{ marginTop: '5px', fontSize: '18px' }}>{watch('date') || 'N/A'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Release Time:</strong>
                    <p style={{ marginTop: '5px', fontSize: '18px' }}>{watch('time') || 'N/A'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Box Number:</strong>
                    <p style={{ marginTop: '5px', fontSize: '18px' }}>{watch('boxNumber') || 'N/A'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Destination Type:</strong>
                    <p style={{ marginTop: '5px', fontSize: '18px' }}>
                      {destinationType === 'local_sale' ? 'Local Sale' : 'Shipment'}
                    </p>
                  </div>
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  <strong style={{ color: '#374151' }}>
                    {destinationType === 'local_sale' ? 'Local Sale Destination:' : 'Shipment Country:'}
                  </strong>
                  <p style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                    {watch('destination') || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Quality Assurance */}
              <div style={{ 
                border: '2px solid #10b981', 
                borderRadius: '12px', 
                padding: '20px',
                backgroundColor: '#ecfdf5',
                marginBottom: '30px'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#065f46' }}>
                  ✅ Quality Assurance
                </h3>
                <p style={{ color: '#065f46', margin: 0 }}>
                  This stock has passed all quality control checks and meets the required standards for release.
                  The crabs are healthy and ready for {destinationType === 'local_sale' ? 'local sale' : 'shipment'}.
                </p>
              </div>

              {/* Footer */}
              <div style={{ 
                borderTop: '2px solid #e5e7eb', 
                paddingTop: '20px',
                marginTop: '40px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                  Certificate generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
                <div style={{ 
                  height: '2px', 
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', 
                  margin: '0 auto', 
                  width: '150px' 
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
