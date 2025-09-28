import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Share2 } from 'lucide-react'
import { useSweetAlert } from '@/hooks/use-sweet-alert'

interface ReportData {
  category: string
  report_type: string
  total_weight: number
  total_pieces: number
  healthy_pieces: number
  damaged_pieces: number
  last_updated?: string
}

interface PDFGeneratorProps {
  reportType: 'TSF' | 'Dutch_Trails'
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ reportType }) => {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData[]>([])
  const sweetAlert = useSweetAlert()

  const fetchReportData = async () => {
    try {
      // Build TSF report directly from crab_entries to match dashboard counts
      const { data, error } = await supabase
        .from('crab_entries')
        .select('box_number, category, report_type, weight_kg, male_count, female_count, health_status, status, updated_at, created_at')
        .eq('report_type', reportType)
        .or('status.is.null,status.eq.available')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Normalize box numbers and keep latest entry per box
      const normalizeBoxNumber = (value: string | null | undefined) => {
        const raw = (value ?? '').toString().trim()
        const num = parseInt(raw, 10)
        return Number.isFinite(num) ? String(num) : raw
      }

      const latestByBox = new Map<string, any>()
      ;(data || []).forEach((e) => {
        const key = normalizeBoxNumber(e.box_number)
        const prev = latestByBox.get(key)
        if (!prev) {
          latestByBox.set(key, e)
          return
        }
        const prevTime = new Date(prev.updated_at || prev.created_at || 0).getTime()
        const curTime = new Date(e.updated_at || e.created_at || 0).getTime()
        if (curTime >= prevTime) {
          latestByBox.set(key, e)
        }
      })

      // Aggregate by category
      const byCategory = new Map<string, ReportData>()
      Array.from(latestByBox.values()).forEach((e: any) => {
        const current = byCategory.get(e.category) || {
          category: e.category,
          report_type: reportType,
          total_weight: 0,
          total_pieces: 0,
          healthy_pieces: 0,
          damaged_pieces: 0,
          last_updated: e.updated_at || e.created_at
        }
        current.total_weight += Number(e.weight_kg) || 0
        const pieces = (Number(e.male_count) || 0) + (Number(e.female_count) || 0)
        current.total_pieces += pieces
        if (e.health_status === 'healthy') current.healthy_pieces += pieces
        if (e.health_status === 'damaged') current.damaged_pieces += pieces
        current.last_updated = e.updated_at || e.created_at || current.last_updated
        byCategory.set(e.category, current)
      })

      return Array.from(byCategory.values()).sort((a, b) => a.category.localeCompare(b.category))
    } catch (error) {
      console.error('Error fetching report data:', error)
      return []
    }
  }

  const generatePDFContent = (data: ReportData[]) => {
    const currentDate = new Date().toLocaleDateString()
    const reportTitle = reportType === 'TSF' 
      ? 'Daily Crab For TSF Stock Report' 
      : 'Daily Crab For Dutch Trails Stock Report'

    const totalStock = data.reduce((acc, item) => ({
      total_weight: acc.total_weight + item.total_weight,
      total_pieces: acc.total_pieces + item.total_pieces,
      healthy_pieces: acc.healthy_pieces + item.healthy_pieces,
      damaged_pieces: acc.damaged_pieces + item.damaged_pieces,
    }), { total_weight: 0, total_pieces: 0, healthy_pieces: 0, damaged_pieces: 0 })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #0ea5e9; 
            margin: 0;
            font-size: 24px;
          }
          .date { 
            color: #666; 
            font-size: 14px;
            margin-top: 10px;
          }
          .summary-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #0ea5e9;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 15px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #0ea5e9;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0;
          }
          th { 
            background-color: #0ea5e9; 
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) { 
            background-color: #f8fafc; 
          }
          tr:hover {
            background-color: #e2e8f0;
          }
          .category-section {
            margin-bottom: 40px;
          }
          .category-title {
            color: #0ea5e9;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .status-healthy { color: #16a34a; font-weight: bold; }
          .status-damaged { color: #dc2626; font-weight: bold; }
          .status-available { color: #0ea5e9; font-weight: bold; }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <div class="date">Generated on: ${currentDate}</div>
        </div>

        <div class="summary-section">
          <h2>Total Stock Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${totalStock.total_weight.toFixed(2)}</div>
              <div class="summary-label">Total Weight (KG)</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalStock.total_pieces}</div>
              <div class="summary-label">Total Pieces</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalStock.healthy_pieces}</div>
              <div class="summary-label">Healthy Pieces</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalStock.damaged_pieces}</div>
              <div class="summary-label">Damaged Pieces</div>
            </div>
          </div>
        </div>

        <div class="category-section">
          <div class="category-title">Stock Details by Category</div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Weight (KG)</th>
                <th>Total Pieces</th>
                <th>Healthy</th>
                <th>Damaged</th>
                <th>Available for Shipment</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td><strong>${item.category}</strong></td>
                  <td>${item.total_weight.toFixed(2)}</td>
                  <td>${item.total_pieces}</td>
                  <td class="status-healthy">${item.healthy_pieces}</td>
                  <td class="status-damaged">${item.damaged_pieces}</td>
                  <td class="status-available">${item.healthy_pieces}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This report was generated automatically by the Mud Crab Stock Management System</p>
          <p>Report Type: ${reportType === 'TSF' ? 'Tropical Sel-Fish (TSF)' : 'Dutch Trails'}</p>
        </div>
      </body>
      </html>
    `
  }

  const generatePDF = async () => {
    setLoading(true)
    try {
      const loadingAlert = sweetAlert.loading('Generating PDF report...')
      const data = await fetchReportData()
      setReportData(data)
      
      const htmlContent = generatePDFContent(data)
      
      // Create a new window with the PDF content
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            loadingAlert.close()
            sweetAlert.success('PDF report generated successfully')
          }, 500)
        }
      }
    } catch (error) {
      sweetAlert.error('Failed to generate PDF report')
      console.error('Error generating PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareOnWhatsApp = async () => {
    try {
      const loadingAlert = sweetAlert.loading('Preparing WhatsApp message...')
      const data = await fetchReportData()
      const currentDate = new Date().toLocaleDateString()
      const reportTitle = reportType === 'TSF' 
        ? 'Daily Crab For TSF Stock Report' 
        : 'Daily Crab For Dutch Trails Stock Report'

      const totalStock = data.reduce((acc, item) => ({
        total_weight: acc.total_weight + item.total_weight,
        total_pieces: acc.total_pieces + item.total_pieces,
        healthy_pieces: acc.healthy_pieces + item.healthy_pieces,
        damaged_pieces: acc.damaged_pieces + item.damaged_pieces,
      }), { total_weight: 0, total_pieces: 0, healthy_pieces: 0, damaged_pieces: 0 })

      // Fetch damaged crab entries for detailed information
      const { data: damagedCrabEntries } = await supabase
        .from('damaged_crabs')
        .select('*')
        .order('created_at', { ascending: false })

      const totalDamagedCrabs = damagedCrabEntries?.length || 0
      const totalDamagedWeight = damagedCrabEntries?.reduce((sum, entry) => sum + entry.weight_kg, 0) || 0

      let message = `*${reportTitle}*\n`
      message += `📅 Date: ${currentDate}\n\n`
      message += `📊 *TOTAL STOCK SUMMARY*\n`
      message += `🏋️ Total Weight: ${totalStock.total_weight.toFixed(2)} KG\n`
      message += `🦀 Total Pieces: ${totalStock.total_pieces}\n`
      message += `✅ Healthy: ${totalStock.healthy_pieces}\n`
      message += `❌ Damaged Stock: ${totalStock.damaged_pieces}\n`
      message += `⚠️ Damaged Crab Entries: ${totalDamagedCrabs}\n`
      message += `🚢 Available for Shipment: ${totalStock.healthy_pieces}\n\n`
      
      message += `📋 *STOCK BY CATEGORY*\n`
      data.forEach(item => {
        message += `\n🔸 *${item.category}*\n`
        message += `   Weight: ${item.total_weight.toFixed(2)} KG\n`
        message += `   Total: ${item.total_pieces} | Healthy: ${item.healthy_pieces} | Damaged: ${item.damaged_pieces}\n`
      })

      // Add detailed damaged crab information if any exist
      if (totalDamagedCrabs > 0) {
        message += `\n\n🔍 *DAMAGED CRAB DETAILS*\n`
        message += `🏋️ Total Damaged Weight: ${totalDamagedWeight} kg\n`
        message += `📊 Average Weight: ${(totalDamagedWeight / totalDamagedCrabs).toFixed(2)} kg\n\n`
        
        // Group by damage type
        const damageTypeStats = damagedCrabEntries?.reduce((acc, entry) => {
          acc[entry.damage_type] = (acc[entry.damage_type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        message += `📋 *Damage Type Breakdown*\n`
        Object.entries(damageTypeStats).forEach(([type, count]) => {
          const percentage = ((count / totalDamagedCrabs) * 100).toFixed(1)
          message += `• ${type}: ${count} (${percentage}%)\n`
        })
        
        message += `\n📝 *Recent Damaged Crab Entries*\n`
        // Show last 3 damaged crab entries
        const recentDamaged = damagedCrabEntries?.slice(0, 3) || []
        
        recentDamaged.forEach((entry, index) => {
          message += `${index + 1}. Box ${entry.box_number} - ${entry.category} (${entry.weight_kg} kg)\n`
          message += `   ${entry.time} - ${entry.damage_type}\n`
          if (entry.damage_description) {
            message += `   📄 ${entry.damage_description.substring(0, 40)}${entry.damage_description.length > 40 ? '...' : ''}\n`
          }
          message += `\n`
        })
      }
      
      message += `\n\n📱 Generated by Mud Crab Stock Management System`

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      loadingAlert.close()
      sweetAlert.success('WhatsApp sharing link opened')
    } catch (error) {
      sweetAlert.error('Failed to prepare WhatsApp message')
      console.error('Error preparing WhatsApp message:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {reportType === 'TSF' ? 'TSF Stock Report' : 'Dutch Trails Stock Report'}
          <Badge variant="outline">
            {reportType === 'TSF' ? 'Tropical Sel-Fish' : 'Dutch Trails'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a comprehensive A4 size PDF report with current stock status and share it directly on WhatsApp.
        </p>
        
        <div className="flex gap-3">
          <Button 
            onClick={generatePDF} 
            disabled={loading}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate PDF'}
          </Button>
          
          <Button 
            onClick={shareOnWhatsApp} 
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}