import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { useDamagedCrabs } from '@/hooks/use-damaged-crabs'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { useToast } from '@/hooks/use-toast'

export const DamagedCrabReport = () => {
  const { entries, loading, fetchDamagedCrabs } = useDamagedCrabs()
  const [generating, setGenerating] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    fetchDamagedCrabs()
  }, [])

  const generatePDF = async () => {
    try {
      setGenerating(true)

      // Create new PDF document with A4 size
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20

      // Add title
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Damaged Crab Report', pageWidth / 2, 30, { align: 'center' })

      // Add subtitle
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, pageWidth / 2, 40, { align: 'center' })

      // Add summary statistics
      const totalWeight = entries.reduce((sum, entry) => sum + entry.weight_kg, 0)
      const damageTypeStats = entries.reduce((acc, entry) => {
        acc[entry.damage_type] = (acc[entry.damage_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary Statistics:', margin, 60)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Total Damaged Crabs: ${entries.length}`, margin, 70)
      doc.text(`Total Weight: ${totalWeight} kg`, margin, 80)
      doc.text(`Average Weight: ${entries.length > 0 ? (totalWeight / entries.length) : 0} kg`, margin, 90)

      // Add damage type breakdown
      doc.setFont('helvetica', 'bold')
      doc.text('Damage Type Breakdown:', margin, 110)
      doc.setFont('helvetica', 'normal')
      
      let yPos = 120
      Object.entries(damageTypeStats).forEach(([type, count]) => {
        doc.text(`${type}: ${count} (${((count / entries.length) * 100).toFixed(1)}%)`, margin + 10, yPos)
        yPos += 8
      })

      // Add detailed table
      const tableData = entries.map(entry => [
        format(new Date(entry.date), 'PP'),
        entry.time,
        entry.box_number,
        entry.category,
        entry.weight_kg,
        entry.damage_type,
        entry.damage_description || '-',
        entry.action_taken || '-',
        entry.notes || '-'
      ])

      // @ts-ignore - jspdf-autotable types are not included
      doc.autoTable({
        startY: yPos + 10,
        head: [['Date', 'Time', 'Box #', 'Category', 'Weight (kg)', 'Damage Type', 'Description', 'Action Taken', 'Notes']],
        body: tableData,
        headStyles: { 
          fillColor: [66, 66, 66],
          fontSize: 8,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 7,
          cellPadding: 2
        },
        margin: { top: yPos + 10, left: margin, right: margin },
        pageBreak: 'auto',
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Date
          1: { cellWidth: 15 }, // Time
          2: { cellWidth: 15 }, // Box #
          3: { cellWidth: 15 }, // Category
          4: { cellWidth: 15 }, // Weight
          5: { cellWidth: 25 }, // Damage Type
          6: { cellWidth: 30 }, // Description
          7: { cellWidth: 30 }, // Action Taken
          8: { cellWidth: 25 }  // Notes
        }
      })

      // Add footer
      const finalY = (doc as any).lastAutoTable.finalY || pageHeight - 30
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('This report was generated automatically by the Crab Inventory Management System', pageWidth / 2, finalY + 10, { align: 'center' })

      // Save the PDF
      const fileName = `damaged-crab-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)

      toast({
        title: 'Success',
        description: 'Damaged crab report generated successfully',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate damaged crab report',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={generatePDF}
      disabled={generating || entries.length === 0}
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Damaged Crab Report
        </>
      )}
    </Button>
  )
}
