import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, TrendingUp, Package, DollarSign, Truck, Calendar, Loader2, Eye, Calculator } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Purchase, PurchaseStats, Supplier } from '@/types/database'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import SupplierManagement from '@/components/supplier/SupplierManagement'
import { PurchaseOrderPreview } from '@/components/purchase/PurchaseOrderPreview'

// Currency conversion function
const convertToLKR = (amount: number, rate: number = 308) => {
  return amount * rate
}

// Currency formatting function (always display in LKR; convert only if source is USD)
const formatCurrency = (amount: number, sourceCurrency: 'USD' | 'LKR' = 'LKR') => {
  const valueInLKR = sourceCurrency === 'USD' ? convertToLKR(amount) : amount
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueInLKR)
}

const PurchasingDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PurchaseStats | null>(null)
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([])
  const [topSuppliers, setTopSuppliers] = useState<Supplier[]>([])
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [previewPurchase, setPreviewPurchase] = useState<Purchase | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const sweetAlert = useSweetAlert()
  const navigate = useNavigate()

  const fetchStats = async () => {
    try {
      const currentMonth = new Date()
      const previousMonth = subMonths(currentMonth, 1)
      
      // Current month purchases
      const { data: currentData, error: currentError } = await supabase
        .from('purchases')
        .select('total_amount, items')
        .gte('date', startOfMonth(currentMonth).toISOString())
        .lte('date', endOfMonth(currentMonth).toISOString())

      if (currentError) throw currentError

      // Previous month purchases
      const { data: previousData, error: previousError } = await supabase
        .from('purchases')
        .select('total_amount, items')
        .gte('date', startOfMonth(previousMonth).toISOString())
        .lte('date', endOfMonth(previousMonth).toISOString())

      if (previousError) throw previousError

      // Active suppliers count
      const { count: activeSuppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (suppliersError) throw suppliersError

      // Calculate statistics including average cost per kg
      let totalQuantity = 0
      let totalCost = 0
      let avgCostPerKg = 0

      currentData?.forEach(purchase => {
        const items = purchase.items as any[] || []
        items.forEach(item => {
          totalQuantity += item.quantity_kg || 0
          totalCost += item.total_price || 0
        })
      })

      if (totalQuantity > 0) {
        avgCostPerKg = totalCost / totalQuantity
      }

      const currentMonthStats = currentData?.reduce((acc, purchase) => {
        const items = purchase.items as any[] || []
        const calculatedTotal = items.reduce((total, item) => total + (item.total_price || 0), 0)
        return {
          total: acc.total + calculatedTotal
        }
      }, { total: 0 })

      const previousMonthStats = previousData?.reduce((acc, purchase) => {
        const items = purchase.items as any[] || []
        const calculatedTotal = items.reduce((total, item) => total + (item.total_price || 0), 0)
        return {
          total: acc.total + calculatedTotal
        }
      }, { total: 0 })

      setStats({
        total_amount: currentMonthStats?.total || 0,
        avg_unit_price: avgCostPerKg,
        total_quantity: totalQuantity,
        order_count: currentData?.length || 0,
        month: new Date().toISOString(),
        monthly_total: currentMonthStats?.total || 0,
        monthly_orders: currentData?.length || 0,
        active_suppliers: activeSuppliers || 0,
        average_cost_per_kg: avgCostPerKg,
        previous_monthly_total: previousMonthStats?.total || 0,
        previous_average_cost: 0 // Will calculate if needed
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      sweetAlert.error('Failed to fetch statistics')
    }
  }

  const fetchRecentPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setRecentPurchases(data || [])
    } catch (error) {
      console.error('Error fetching recent purchases:', error)
      sweetAlert.error('Failed to fetch recent purchases')
    }
  }

  const fetchTopSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(4)

      if (error) throw error
      setTopSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching top suppliers:', error)
      sweetAlert.error('Failed to fetch suppliers')
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchStats(),
          fetchRecentPurchases(),
          fetchTopSuppliers()
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()

    // Set up realtime subscription
    const purchaseSubscription = supabase
      .channel('purchase_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => {
        fetchStats()
        fetchRecentPurchases()
      })
      .subscribe()

    return () => {
      purchaseSubscription.unsubscribe()
    }
  }, [])

  const handleCreatePurchaseOrder = () => {
    navigate('/create-purchase')
  }

  const handleManageSuppliers = () => {
    setSupplierDialogOpen(true)
  }

  const handleViewAnalytics = () => {
    navigate('/purchase-analytics')
  }

  const handlePreviewPurchase = (purchase: Purchase) => {
    setPreviewPurchase(purchase)
    setShowPreview(true)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setPreviewPurchase(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const getPurchaseStatusColor = (amount: number) => {
    if (amount > 3000) return 'bg-success/20 text-success'
    if (amount > 2000) return 'bg-primary/20 text-primary'
    if (amount > 1000) return 'bg-warning/20 text-warning'
    return 'bg-muted text-muted-foreground'
  }

  const renderPurchaseCalculation = (purchase: Purchase) => {
    const items = purchase.items as any[] || []
    if (items.length === 0) return null

    const item = items[0]
    return (
      <div className="text-xs text-muted-foreground mt-1">
        <Calculator className="h-3 w-3 inline mr-1" />
        {item.quantity_kg} kg × LKR {item.unit_price}/kg
      </div>
    )
  }

  const calculatePurchaseTotal = (purchase: Purchase) => {
    const items = purchase.items as any[] || []
    if (items.length === 0) return 0
    
    console.log('Calculating total for purchase:', purchase.id, 'Items:', items)
    
    const total = items.reduce((total, item) => {
      console.log('Item:', item, 'total_price:', item.total_price)
      return total + (item.total_price || 0)
    }, 0)
    
    console.log('Calculated total:', total, 'vs stored total_amount:', purchase.total_amount)
    return total
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Purchasing Dashboard</h1>
          <p className="text-muted-foreground">Manage procurement and supplier relationships</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.monthly_total || 0, 'LKR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total prices of {stats?.monthly_orders || 0} purchase orders
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPercentageChange(stats?.monthly_total || 0, stats?.previous_monthly_total || 0)}% from last month
              </p>
              {stats?.monthly_orders > 0 && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <p className="text-xs text-primary/70">
                    <span className="font-medium">Breakdown:</span> {stats.monthly_orders} orders placed
                  </p>
                  <p className="text-xs text-primary/70">
                    <span className="font-medium">Average:</span> {formatCurrency((stats?.monthly_total || 0) / (stats?.monthly_orders || 1), 'LKR')} per order
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-success/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
              <Package className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.monthly_orders || 0}</div>
              <p className="text-xs text-muted-foreground">Purchase orders placed</p>
              {stats?.monthly_orders > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency((stats?.monthly_total || 0) / (stats?.monthly_orders || 1), 'LKR')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats?.active_suppliers || 0}</div>
              <p className="text-xs text-muted-foreground">Verified partners</p>
            </CardContent>
          </Card>

          <Card className="border-warning/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Cost/kg</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(stats?.average_cost_per_kg || 0, 'LKR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {getPercentageChange(stats?.average_cost_per_kg || 0, stats?.previous_average_cost || 0)}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Purchase Summary */}
        <Card className="shadow-md mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Monthly Purchase Summary
            </CardTitle>
            <CardDescription>Total prices and breakdown of purchase orders placed this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(stats?.monthly_total || 0, 'LKR')}
                </div>
                <p className="text-sm font-medium text-primary">Total Purchase Order Prices</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sum of all purchase order totals
                </p>
              </div>
              
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="text-3xl font-bold text-success mb-2">
                  {stats?.monthly_orders || 0}
                </div>
                <p className="text-sm font-medium text-success">Purchase Orders Placed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Number of orders created this month
                </p>
              </div>
              
              <div className="text-center p-4 bg-warning/5 rounded-lg">
                <div className="text-3xl font-bold text-warning mb-2">
                  {stats?.monthly_orders > 0 
                    ? formatCurrency((stats?.monthly_total || 0) / (stats?.monthly_orders || 1), 'LKR')
                    : 'LKR 0.00'
                  }
                </div>
                <p className="text-sm font-medium text-warning">Average Order Price</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average total price per order
                </p>
              </div>
            </div>
            
            {stats?.monthly_orders > 0 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-3">Purchase Order Price Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Total Purchase Orders:</span> {stats.monthly_orders}</p>
                    <p><span className="font-medium">Total Prices:</span> {formatCurrency(stats.monthly_total, 'LKR')}</p>
                    <p><span className="font-medium">Total Quantity:</span> {stats.total_quantity?.toFixed(2) || 0} kg</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Average Order Price:</span> {formatCurrency(stats.monthly_total / stats.monthly_orders, 'LKR')}</p>
                    <p><span className="font-medium">Average Cost per kg:</span> {formatCurrency(stats.average_cost_per_kg || 0, 'LKR')}</p>
                    <p><span className="font-medium">Previous Month Total:</span> {formatCurrency(stats.previous_monthly_total || 0, 'LKR')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Recent Orders */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Purchase Orders</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchRecentPurchases()
                    fetchStats()
                  }}
                  className="h-8 px-3"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>Latest procurement activities with detailed breakdowns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPurchases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent purchases</p>
                ) : (
                  recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">PO-{purchase.id.slice(0, 8)}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPurchaseStatusColor(calculatePurchaseTotal(purchase))}`}>
                              {formatCurrency(calculatePurchaseTotal(purchase), 'LKR')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{purchase.supplier_name}</p>
                          {renderPurchaseCalculation(purchase)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewPurchase(purchase)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Details Summary */}
                      <div className="bg-muted/20 rounded p-3 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-medium">Order Date:</span> {format(new Date(purchase.date), 'dd/MM/yyyy')}</p>
                            <p><span className="font-medium">Delivery:</span> {format(new Date(purchase.delivery_date), 'dd/MM/yyyy')}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Status:</span> 
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                purchase.status === 'completed' ? 'bg-success/20 text-success' :
                                purchase.status === 'pending' ? 'bg-warning/20 text-warning' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {purchase.status}
                              </span>
                            </p>
                            <p><span className="font-medium">Currency:</span> {purchase.currency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Performance */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Suppliers
              </CardTitle>
              <CardDescription>Performance ranking this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSuppliers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No suppliers found</p>
                ) : (
                  topSuppliers.map((supplier, index) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.contact_person}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-warning">★</span>
                          <span className="text-xs text-muted-foreground">{supplier.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common purchasing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                className="h-20 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 flex-col"
                size="lg"
                onClick={handleCreatePurchaseOrder}
              >
                <ShoppingCart className="h-6 w-6 mb-2" />
                Create Purchase Order
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 border-success text-success hover:bg-success/10 flex-col"
                size="lg"
                onClick={handleManageSuppliers}
              >
                <Truck className="h-6 w-6 mb-2" />
                Manage Suppliers
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 border-accent text-accent hover:bg-accent/10 flex-col"
                size="lg"
                onClick={handleViewAnalytics}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Supplier Management</DialogTitle>
          </DialogHeader>
          <SupplierManagement />
        </DialogContent>
      </Dialog>

      {/* Purchase Order Preview */}
      {previewPurchase && (
        <PurchaseOrderPreview
          purchase={previewPurchase}
          isOpen={showPreview}
          onClose={handleClosePreview}
        />
      )}
    </div>
  )
}

export default PurchasingDashboard