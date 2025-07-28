import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Package, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { PDFGenerator } from '@/components/reports/PDFGenerator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Activity, SystemAlert, User } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface StockStats {
  total_weight: number
  healthy_weight: number
  damaged_weight: number
  total_boxes: number
  healthy_boxes: number
  damaged_boxes: number
}

interface UserStats {
  total: number
  qc: number
  purchasing: number
  admin: number
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stockStats, setStockStats] = useState<StockStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const navigate = useNavigate()
  const sweetAlert = useSweetAlert()

  const fetchStockStats = async () => {
    try {
      const { data: stockData, error: stockError } = await supabase
        .from('crab_entries')
        .select('weight_kg, health_status')

      if (stockError) throw stockError

      const stats = stockData.reduce((acc, curr) => ({
        total_weight: acc.total_weight + curr.weight_kg,
        healthy_weight: acc.healthy_weight + (curr.health_status === 'healthy' ? curr.weight_kg : 0),
        damaged_weight: acc.damaged_weight + (curr.health_status === 'damaged' ? curr.weight_kg : 0),
        total_boxes: acc.total_boxes + 1,
        healthy_boxes: acc.healthy_boxes + (curr.health_status === 'healthy' ? 1 : 0),
        damaged_boxes: acc.damaged_boxes + (curr.health_status === 'damaged' ? 1 : 0),
      }), {
        total_weight: 0,
        healthy_weight: 0,
        damaged_weight: 0,
        total_boxes: 0,
        healthy_boxes: 0,
        damaged_boxes: 0,
      })

      setStockStats(stats)
    } catch (error) {
      console.error('Error fetching stock stats:', error)
      sweetAlert.error('Failed to fetch stock statistics')
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')

      if (userError) throw userError

      const stats = (userData || []).reduce((acc, curr) => ({
        total: acc.total + 1,
        qc: acc.qc + (curr.role === 'quality_control' ? 1 : 0),
        purchasing: acc.purchasing + (curr.role === 'purchasing' ? 1 : 0),
        admin: acc.admin + (curr.role === 'admin' ? 1 : 0),
      }), { total: 0, qc: 0, purchasing: 0, admin: 0 })

      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      sweetAlert.error('Failed to fetch user statistics')
    }
  }

  const fetchActivities = async () => {
    try {
      const { data: activityData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4) as { data: Activity[] | null, error: any }

      if (activitiesError) throw activitiesError
      setActivities(activityData || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      sweetAlert.error('Failed to fetch recent activities')
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchStockStats(),
          fetchUserStats(),
          fetchActivities()
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()

    // Set up realtime subscriptions
    const stockSubscription = supabase
      .channel('stock_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crab_entries' }, () => {
        fetchStockStats()
      })
      .subscribe()

    const activitySubscription = supabase
      .channel('activity_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, () => {
        fetchActivities()
      })
      .subscribe()

    return () => {
      stockSubscription.unsubscribe()
      activitySubscription.unsubscribe()
    }
  }, [])

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'users':
        navigate('/users')
        break
      case 'reports':
        setReportDialogOpen(true)
        break
      case 'stock':
        navigate('/stock')
        break
      case 'alerts':
        const { data: alerts, error: alertsError } = await supabase
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5) as { data: SystemAlert[] | null, error: any }

        if (alertsError) {
          sweetAlert.error('Failed to fetch system alerts')
          return
        }

        const alertHtml = (alerts || []).map(alert => 
          `<div class="mb-3 p-3 rounded bg-gray-100">
            <div class="font-bold">${alert.title}</div>
            <div class="text-sm">${alert.message}</div>
            <div class="text-xs text-gray-500">${new Date(alert.created_at).toLocaleString()}</div>
          </div>`
        ).join('') || 'No system alerts found'

        sweetAlert.modal({
          title: 'System Alerts',
          html: alertHtml,
          width: '90%',
          showConfirmButton: true,
          confirmButtonText: 'Close'
        })
        break
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of the complete crab stock management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stockStats?.total_weight.toFixed(2)} kg</div>
              <p className="text-xs text-muted-foreground">{stockStats?.total_boxes} boxes in total</p>
            </CardContent>
          </Card>

          <Card className="border-success/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stockStats?.healthy_weight.toFixed(2)} kg</div>
              <p className="text-xs text-muted-foreground">{((stockStats?.healthy_weight || 0) / (stockStats?.total_weight || 1) * 100).toFixed(1)}% of total stock</p>
            </CardContent>
          </Card>

          <Card className="border-warning/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Damaged Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stockStats?.damaged_weight.toFixed(2)} kg</div>
              <p className="text-xs text-muted-foreground">{((stockStats?.damaged_weight || 0) / (stockStats?.total_weight || 1) * 100).toFixed(1)}% of total stock</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{userStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {userStats?.qc || 0} QC, {userStats?.purchasing || 0} Purchasing, {userStats?.admin || 0} Admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent activities</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'add' ? 'bg-success' :
                        activity.type === 'update' ? 'bg-primary' :
                        activity.type === 'damage' ? 'bg-warning' :
                        'bg-accent'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => handleQuickAction('users')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium text-sm">User Management</h3>
                    <p className="text-xs text-muted-foreground">Manage users and roles</p>
                  </div>
                </div>
                <div 
                  onClick={() => handleQuickAction('reports')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-success mx-auto mb-2" />
                    <h3 className="font-medium text-sm">Generate Reports</h3>
                    <p className="text-xs text-muted-foreground">Create stock reports</p>
                  </div>
                </div>
                <div 
                  onClick={() => handleQuickAction('stock')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <Package className="h-8 w-8 text-accent mx-auto mb-2" />
                    <h3 className="font-medium text-sm">Stock Overview</h3>
                    <p className="text-xs text-muted-foreground">View complete inventory</p>
                  </div>
                </div>
                <div 
                  onClick={() => handleQuickAction('alerts')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                    <h3 className="font-medium text-sm">System Alerts</h3>
                    <p className="text-xs text-muted-foreground">Check system status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Stock Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <PDFGenerator reportType="TSF" />
            <PDFGenerator reportType="Dutch_Trails" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDashboard