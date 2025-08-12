import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Truck, ArrowLeft } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface PurchaseData {
  date: string
  total_amount: number
  supplier_name: string
}

interface SupplierPerformance {
  supplier_name: string
  total_purchases: number
  order_count: number
}

const PurchaseAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([])
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([])
  const sweetAlert = useSweetAlert()
  const navigate = useNavigate()

  const fetchAnalytics = async () => {
    try {
      // Fetch last 6 months of purchase data
      const sixMonthsAgo = subMonths(new Date(), 6)
      
      const { data: purchaseHistory, error: purchaseError } = await supabase
        .from('purchases')
        .select('date, total_amount, supplier_name')
        .gte('date', sixMonthsAgo.toISOString())
        .order('date')

      if (purchaseError) throw purchaseError

      // Fetch supplier performance data
      const { data: supplierData, error: supplierError } = await supabase
        .from('purchases')
        .select('supplier_name, total_amount')

      if (supplierError) throw supplierError

      // Process supplier performance data
      const supplierStats = supplierData.reduce((acc: Record<string, SupplierPerformance>, curr) => {
        if (!acc[curr.supplier_name]) {
          acc[curr.supplier_name] = {
            supplier_name: curr.supplier_name,
            total_purchases: 0,
            order_count: 0
          }
        }
        acc[curr.supplier_name].total_purchases += curr.total_amount
        acc[curr.supplier_name].order_count += 1
        return acc
      }, {})

      setPurchaseData(purchaseHistory || [])
      setSupplierPerformance(Object.values(supplierStats)
        .sort((a, b) => b.total_purchases - a.total_purchases)
        .slice(0, 5))
    } catch (error) {
      console.error('Error fetching analytics:', error)
      sweetAlert.error('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Purchase Analytics</h1>
          <p className="text-muted-foreground">Analyze purchasing trends and performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/purchasing')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Trends Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Purchase Trends
            </CardTitle>
            <CardDescription>Monthly purchase amounts</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={purchaseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="total_amount"
                  stroke="#2563eb"
                  name="Total Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supplier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Supplier Distribution
            </CardTitle>
            <CardDescription>Purchase distribution by supplier</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={purchaseData.reduce((acc: any[], curr) => {
                  const existing = acc.find(item => item.supplier_name === curr.supplier_name)
                  if (existing) {
                    existing.total_amount += curr.total_amount
                  } else {
                    acc.push({
                      supplier_name: curr.supplier_name,
                      total_amount: curr.total_amount
                    })
                  }
                  return acc
                }, [])}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier_name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                <Bar dataKey="total_amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Top Suppliers
            </CardTitle>
            <CardDescription>Best performing suppliers by purchase value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierPerformance.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No supplier data available</p>
              ) : (
                supplierPerformance.map((supplier) => (
                  <div 
                    key={supplier.supplier_name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div>
                      <p className="font-medium">{supplier.supplier_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.order_count || 0} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">
                        ${(supplier.total_purchases || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${supplier.order_count > 0 
                          ? ((supplier.total_purchases || 0) / supplier.order_count).toFixed(2) 
                          : '0.00'} avg/order
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PurchaseAnalytics 