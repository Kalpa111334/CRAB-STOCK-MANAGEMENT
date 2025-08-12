import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { useDeadCrabs } from '@/hooks/use-dead-crabs'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { useToast } from '@/hooks/use-toast'

export const DeadCrabReport = () => {
  const { entries, loading, fetchDeadCrabs } = useDeadCrabs()
  const [generating, setGenerating] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    fetchDeadCrabs()
  }, [])

  const generatePDF = async () => {
    try {
      setGenerating(true)

      // Create new PDF document
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Add title
      doc.setFontSize(20)
      doc.text('Dead Crab Report', pageWidth / 2, 20, { align: 'center' })

      // Add date
      doc.setFontSize(12)
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, pageWidth / 2, 30, { align: 'center' })

      // Add summary statistics
      const totalWeight = entries.reduce((sum, entry) => sum + entry.weight_kg, 0)

      doc.text('Summary:', 14, 45)
      doc.text(`Total Dead Crabs: ${entries.length}`, 14, 55)
      doc.text(`Total Weight: ${totalWeight.toFixed(2)} kg`, 14, 65)

      // Add detailed table
      const tableData = entries.map(entry => [
        format(new Date(entry.date), 'PP'),
        entry.time,
        entry.box_number,
        entry.category,
        entry.weight_kg.toFixed(2),
        entry.cause_of_death,
        entry.notes || '-'
      ])

      // @ts-ignore - jspdf-autotable types are not included
      doc.autoTable({
        startY: 80,
        head: [['Date', 'Time', 'Box #', 'Category', 'Weight (kg)', 'Cause', 'Notes']],
        body: tableData,
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
        margin: { top: 80 },
      })

      // Save the PDF
      const fileName = `dead-crab-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)

      toast({
        title: 'Success',
        description: 'Dead crab report generated successfully',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate dead crab report',
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
          Generate Dead Crab Report
        </>
      )}
    </Button>
  )
} 