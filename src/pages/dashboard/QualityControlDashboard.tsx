import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, AlertTriangle, CheckCircle, Grid3X3, FileText, Share2, Loader2, Skull, Send } from 'lucide-react'
import { CrabEntryDialog } from '@/components/crab/CrabEntryDialog'
import { DeadCrabEntryDialog } from '@/components/crab/DeadCrabEntryDialog'
import { DamageCrabEntryDialog } from '@/components/crab/DamageCrabEntryDialog'
import { CrabStockReleasingDialog } from '@/components/crab/CrabStockReleasingDialog'
import { useCrabEntries } from '@/hooks/use-crab-entries'
import { useDeadCrabs } from '@/hooks/use-dead-crabs'
import { useDamagedCrabs } from '@/hooks/use-damaged-crabs'
import { useToast } from '@/hooks/use-toast'
import { PDFGenerator } from '@/components/reports/PDFGenerator'
import { DeadCrabReport } from '@/components/reports/DeadCrabReport'
import { DamagedCrabReport } from '@/components/reports/DamagedCrabReport'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { CreateGRNDialog } from '@/components/grn/CreateGRNDialog'

const QualityControlDashboard = () => {
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [releasedBoxes, setReleasedBoxes] = useState<Set<string>>(new Set())
  const { entries, loading, addEntry } = useCrabEntries()
  const { entries: deadCrabEntries, addDeadCrab, loading: loadingDeadCrabs } = useDeadCrabs()
  const { entries: damagedCrabEntries, addDamagedCrab, loading: loadingDamagedCrabs } = useDamagedCrabs()
  const { toast } = useToast()
  const sweetAlert = useSweetAlert()
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  // Group entries by box number
  const boxEntries = entries.reduce((acc, entry) => {
    acc[entry.box_number] = entry
    return acc
  }, {} as Record<string, typeof entries[0]>)

  const totalBoxes = 290 // Updated from 90 to 290 boxes
  const filledBoxes = entries.length
  const damagedBoxes = entries.filter(entry => entry.health_status === 'damaged').length
  const emptyBoxes = totalBoxes - filledBoxes
  const totalDeadCrabs = deadCrabEntries.length
  const totalDamagedCrabs = damagedCrabEntries.length

  const getBoxColor = (boxNumber: string) => {
    const entry = boxEntries[boxNumber]
    if (!entry) return 'bg-muted border-border hover:bg-muted/60'
    return entry.health_status === 'damaged'
      ? 'bg-destructive/20 border-destructive hover:bg-destructive/30'
      : 'bg-success/20 border-success hover:bg-success/30'
  }

  const handleShare = async () => {
    try {
      const currentDate = new Date().toLocaleDateString()
      
      // Calculate total weight of damaged crabs
      const totalDamagedWeight = damagedCrabEntries.reduce((sum, entry) => sum + entry.weight_kg, 0)
      
      // Group damaged crabs by damage type
      const damageTypeStats = damagedCrabEntries.reduce((acc, entry) => {
        acc[entry.damage_type] = (acc[entry.damage_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      let text = `🦀 *Crab Inventory Status*\n`
      text += `📅 Date: ${currentDate}\n\n`
      text += `📊 *OVERALL SUMMARY*\n`
      text += `📦 Total Boxes: ${totalBoxes}\n`
      text += `✅ Filled: ${filledBoxes}\n`
      text += `❌ Damaged Boxes: ${damagedBoxes}\n`
      text += `📭 Empty: ${emptyBoxes}\n`
      text += `💀 Dead Crabs: ${totalDeadCrabs}\n`
      text += `⚠️ Damaged Crabs: ${totalDamagedCrabs}\n\n`

      // Add detailed damaged crab information if any exist
      if (totalDamagedCrabs > 0) {
        text += `🔍 *DAMAGED CRAB DETAILS*\n`
        text += `🏋️ Total Damaged Weight: ${totalDamagedWeight} kg\n`
        text += `📊 Average Weight: ${(totalDamagedWeight / totalDamagedCrabs).toFixed(2)} kg\n\n`
        
        text += `📋 *Damage Type Breakdown*\n`
        Object.entries(damageTypeStats).forEach(([type, count]) => {
          const percentage = ((count / totalDamagedCrabs) * 100).toFixed(1)
          text += `• ${type}: ${count} (${percentage}%)\n`
        })
        
        text += `\n📝 *Recent Damaged Crab Entries*\n`
        // Show last 5 damaged crab entries
        const recentDamaged = damagedCrabEntries
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
        
        recentDamaged.forEach((entry, index) => {
          text += `${index + 1}. Box ${entry.box_number} - ${entry.category} (${entry.weight_kg} kg)\n`
          text += `   ${entry.damage_type} - ${entry.time}\n`
          if (entry.damage_description) {
            text += `   📄 ${entry.damage_description.substring(0, 50)}${entry.damage_description.length > 50 ? '...' : ''}\n`
          }
          text += `\n`
        })
      }

      text += `\n📱 Generated by Crab Stock Guardian System`

      if (navigator.share) {
        await navigator.share({
          title: 'Crab Inventory Status',
          text: text
        })
        sweetAlert.success('Inventory status shared successfully')
      } else {
        await navigator.clipboard.writeText(text)
        sweetAlert.success('Inventory status copied to clipboard')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      sweetAlert.error('Failed to share inventory status')
    }
  }

  const handleGenerateReport = () => {
    setReportDialogOpen(true)
  }

  const handleBoxRelease = (boxNumber: string) => {
    setReleasedBoxes(prev => {
      const newSet = new Set(prev)
      newSet.add(boxNumber)
      return newSet
    })
    toast({
      title: "Box Released",
      description: `Box ${boxNumber} has been marked as released`,
    })
  }

  const handleBoxClick = async (boxNumber: string, entry: typeof entries[0] | undefined, deadCrabs: typeof deadCrabEntries, damagedCrabs: typeof damagedCrabEntries) => {
    setSelectedBox(selectedBox === boxNumber ? null : boxNumber)
    
    if (!entry && deadCrabs.length === 0 && damagedCrabs.length === 0) {
      await sweetAlert.info(`Box ${boxNumber} is currently empty`, 'Empty Box')
      return
    }

    let htmlContent = `
      <div style="text-align: left; font-family: Arial, sans-serif;">
        <h3 style="color: #1f2937; margin-bottom: 15px; text-align: center;">Box ${boxNumber} Details</h3>
    `

    if (entry) {
      const statusBadges = Array.isArray(entry.crab_status) 
        ? entry.crab_status.map(status => `<span style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 4px;">${status}</span>`).join('')
        : ''

      htmlContent += `
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">🦀 Live Crab Entry</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            <div><strong>Date:</strong> ${new Date(entry.date).toISOString().split('T')[0]}</div>
            <div><strong>Supplier:</strong> ${entry.supplier}</div>
            <div><strong>Weight:</strong> ${entry.weight_kg} kg</div>
            <div><strong>Category:</strong> ${entry.category}</div>
            <div><strong>Males:</strong> ${entry.male_count}</div>
            <div><strong>Females:</strong> ${entry.female_count}</div>
            <div><strong>Health:</strong> <span style="color: ${entry.health_status === 'healthy' ? '#059669' : '#dc2626'}">${entry.health_status}</span></div>
            <div><strong>Report Type:</strong> ${entry.report_type}</div>
          </div>
          ${statusBadges ? `<div style="margin-top: 10px;"><strong>Status:</strong><br>${statusBadges}</div>` : ''}
          ${entry.damaged_details ? `<div style="margin-top: 10px;"><strong>Damage Details:</strong><br><em>${entry.damaged_details}</em></div>` : ''}
        </div>
      `
    }

    if (deadCrabs.length > 0) {
      htmlContent += `
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px;">
          <h4 style="color: #991b1b; margin-bottom: 10px;">💀 Dead Crab Records (${deadCrabs.length})</h4>
      `
      
      deadCrabs.forEach((deadCrab, index) => {
        htmlContent += `
          <div style="border-bottom: ${index < deadCrabs.length - 1 ? '1px solid #fecaca' : 'none'}; padding-bottom: 10px; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
              <div><strong>Date:</strong> ${new Date(deadCrab.date).toLocaleDateString()}</div>
              <div><strong>Time:</strong> ${deadCrab.time}</div>
              <div><strong>Weight:</strong> ${deadCrab.weight_kg} kg</div>
              <div><strong>Category:</strong> ${deadCrab.category}</div>
              ${deadCrab.cause_of_death ? `<div style="grid-column: 1 / -1;"><strong>Cause:</strong> ${deadCrab.cause_of_death}</div>` : ''}
              ${deadCrab.notes ? `<div style="grid-column: 1 / -1;"><strong>Notes:</strong> <em>${deadCrab.notes}</em></div>` : ''}
            </div>
          </div>
        `
      })
      
      htmlContent += `</div>`
    }

    if (damagedCrabs.length > 0) {
      htmlContent += `
        <div style="background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px;">
          <h4 style="color: #856404; margin-bottom: 10px;">⚠️ Damaged Crab Records (${damagedCrabs.length})</h4>
      `
      
      damagedCrabs.forEach((damagedCrab, index) => {
        htmlContent += `
          <div style="border-bottom: ${index < damagedCrabs.length - 1 ? '1px solid #ffeaa7' : 'none'}; padding-bottom: 10px; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
              <div><strong>Date:</strong> ${new Date(damagedCrab.date).toLocaleDateString()}</div>
              <div><strong>Time:</strong> ${damagedCrab.time}</div>
              <div><strong>Weight:</strong> ${damagedCrab.weight_kg} kg</div>
              <div><strong>Category:</strong> ${damagedCrab.category}</div>
              <div style="grid-column: 1 / -1;"><strong>Damage Type:</strong> ${damagedCrab.damage_type}</div>
              ${damagedCrab.damage_description ? `<div style="grid-column: 1 / -1;"><strong>Description:</strong> ${damagedCrab.damage_description}</div>` : ''}
              ${damagedCrab.action_taken ? `<div style="grid-column: 1 / -1;"><strong>Action Taken:</strong> ${damagedCrab.action_taken}</div>` : ''}
              ${damagedCrab.notes ? `<div style="grid-column: 1 / -1;"><strong>Notes:</strong> <em>${damagedCrab.notes}</em></div>` : ''}
            </div>
          </div>
        `
      })
      
      htmlContent += `</div>`
    }

    htmlContent += `</div>`

    await sweetAlert.modal({
      title: `Box ${boxNumber}`,
      html: htmlContent,
      width: '600px',
      confirmButtonText: 'Close'
    })
  }

  if (loading || loadingDeadCrabs || loadingDamagedCrabs) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Quality Control Dashboard</h1>
            <p className="text-muted-foreground">Manage crab stock quality and inventory</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 sm:mb-8">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
                <Grid3X3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalBoxes}</div>
                <p className="text-xs text-muted-foreground">Available storage units</p>
              </CardContent>
            </Card>

            <Card className="border-success/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filled Boxes</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{filledBoxes}</div>
                <p className="text-xs text-muted-foreground">{Math.round((filledBoxes / totalBoxes) * 100)}% capacity</p>
              </CardContent>
            </Card>

            <Card className="border-warning/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Damaged Crabs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{totalDamagedCrabs}</div>
                <p className="text-xs text-muted-foreground">Total recorded</p>
              </CardContent>
            </Card>

            <Card className="border-muted shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empty Boxes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{emptyBoxes}</div>
                <p className="text-xs text-muted-foreground">Ready for use</p>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dead Crabs</CardTitle>
                <Skull className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totalDeadCrabs}</div>
                <p className="text-xs text-muted-foreground">Total removed</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Released Boxes</CardTitle>
                <Send className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{releasedBoxes.size}</div>
                <p className="text-xs text-muted-foreground">Ready for dispatch</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 sm:mb-8">
            <CrabEntryDialog
              onSubmit={async (data) => {
                await addEntry({
                  ...data,
                  date: new Date().toISOString()
                });
              }}
              trigger={
                <Button 
                  className="h-12 sm:h-16 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 w-full"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Crab Entry
                </Button>
              }
            />

            <DeadCrabEntryDialog
              selectedBox={selectedBox || undefined}
              onSubmit={async (data) => {
                await addDeadCrab({
                  box_number: data.box_number,
                  category: data.category,
                  weight_kg: data.weight_kg,
                  time: data.time,
                  cause_of_death: data.cause_of_death,
                  notes: data.notes
                });
              }}
              trigger={
                <Button 
                  variant="outline" 
                  className="h-12 sm:h-16 border-destructive text-destructive hover:bg-destructive/10 w-full"
                  size="lg"
                >
                  <Skull className="mr-2 h-5 w-5" />
                  Record Dead Crab
                </Button>
              }
            />

            <DamageCrabEntryDialog
              selectedBox={selectedBox || undefined}
              onSubmit={async (data) => {
                await addDamagedCrab({
                  box_number: data.box_number,
                  category: data.category,
                  weight_kg: data.weight_kg,
                  time: data.time,
                  damage_type: data.damage_type,
                  damage_description: data.damage_description,
                  action_taken: data.action_taken,
                  notes: data.notes
                });
              }}
              trigger={
                <Button 
                  variant="outline" 
                  className="h-12 sm:h-16 border-warning text-warning hover:bg-warning/10 w-full"
                  size="lg"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Damage Crab
                </Button>
              }
            />

            <CreateGRNDialog />
            
            <CrabStockReleasingDialog
              trigger={
                <Button 
                  variant="outline" 
                  className="h-12 sm:h-16 border-blue-500 text-blue-600 hover:bg-blue-50 w-full"
                  size="lg"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Crab Stock Releasing
                </Button>
              }
            />
            
            <Button 
              variant="outline" 
              className="h-12 sm:h-16 border-success text-success hover:bg-success/10 w-full"
              size="lg"
              onClick={handleGenerateReport}
            >
              <FileText className="mr-2 h-5 w-5" />
              Generate TSF Report
            </Button>
            
            <Button 
              variant="outline" 
              className="h-12 sm:h-16 border-accent text-accent hover:bg-accent/10 w-full"
              size="lg"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share Status
            </Button>
          </div>

          {/* Box Grid */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Storage Boxes Grid
              </CardTitle>
              <CardDescription>
                Click on any box to view details or add new entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1 sm:gap-2">
                {Array.from({ length: totalBoxes }, (_, i) => {
                  const boxNumber = (i + 1).toString() // Simple number without padding
                  const entry = boxEntries[boxNumber]
                  const deadCrabsInBox = deadCrabEntries.filter(d => d.box_number === boxNumber)
                  const damagedCrabsInBox = damagedCrabEntries.filter(d => d.box_number === boxNumber)
                  
                  return (
                    <div
                      key={boxNumber}
                      className={`
                        aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 
                        flex flex-col items-center justify-center p-1 sm:p-2 text-[8px] sm:text-xs relative
                        ${getBoxColor(boxNumber)}
                        ${selectedBox === boxNumber ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}
                      onClick={() => handleBoxClick(boxNumber, entry, deadCrabsInBox, damagedCrabsInBox)}
                    >
                      <div className="font-bold text-foreground text-[10px] sm:text-sm">{boxNumber}</div>
                      {entry && (
                        <>
                          <div className="text-[8px] sm:text-[10px] text-muted-foreground">{entry.weight_kg}kg</div>
                          <Badge 
                            variant="secondary" 
                            className="text-[6px] sm:text-[8px] px-1 py-0 h-3 sm:h-4 mt-0.5 sm:mt-1 hidden sm:block"
                          >
                            {entry.category}
                          </Badge>
                        </>
                      )}
                      {deadCrabsInBox.length > 0 && selectedBox === boxNumber && (
                        <Badge 
                          variant="destructive"
                          className="text-[6px] sm:text-[8px] px-1 py-0 h-3 sm:h-4 mt-0.5 sm:mt-1"
                        >
                          {deadCrabsInBox.length} dead
                        </Badge>
                      )}
                      {damagedCrabsInBox.length > 0 && selectedBox === boxNumber && (
                        <Badge 
                          variant="secondary"
                          className="text-[6px] sm:text-[8px] px-1 py-0 h-3 sm:h-4 mt-0.5 sm:mt-1"
                        >
                          {damagedCrabsInBox.length} damaged
                        </Badge>
                      )}
                      {releasedBoxes.has(boxNumber) && (
                        <div className="absolute top-1 right-1">
                          <Send className="h-3 w-3 text-blue-600" />
                        </div>
                      )}
                      {selectedBox === boxNumber && !releasedBoxes.has(boxNumber) && entry && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute bottom-1 left-1 h-5 w-5 p-0 text-[6px] bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBoxRelease(boxNumber)
                          }}
                          title="Mark as released"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
                  <span className="text-sm text-muted-foreground">Healthy Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive"></div>
                  <span className="text-sm text-muted-foreground">Damaged Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border border-border"></div>
                  <span className="text-sm text-muted-foreground">Empty Box</span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Released Box</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Reports</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <PDFGenerator reportType="TSF" />
            <PDFGenerator reportType="Dutch_Trails" />
            <DeadCrabReport />
            <DamagedCrabReport />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default QualityControlDashboard