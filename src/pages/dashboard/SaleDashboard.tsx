import React from 'react'

const SaleDashboard: React.FC = () => {
  console.log('SaleDashboard: Component is rendering!')
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#333', 
          fontSize: '32px', 
          marginBottom: '10px',
          borderBottom: '3px solid #007bff',
          paddingBottom: '10px'
        }}>
          🦀 Sale Dashboard Test
        </h1>
        
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          border: '2px solid #28a745', 
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#155724', marginBottom: '10px' }}>
            ✅ Component Status Check
          </h2>
          <ul style={{ color: '#155724', fontSize: '16px' }}>
            <li>✅ SaleDashboard component is loading</li>
            <li>✅ React is working</li>
            <li>✅ Route is accessible</li>
            <li>✅ Basic rendering is functional</li>
          </ul>
        </div>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '2px solid #ffc107', 
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '5px' }}>
            🔍 Debug Information
          </h3>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>Timestamp:</strong> {new Date().toLocaleString()}
          </p>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
          </p>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>Window Size:</strong> {window.innerWidth} x {window.innerHeight}
          </p>
          <p style={{ color: '#856404' }}>
            <strong>URL:</strong> {window.location.href}
          </p>
        </div>

        <div style={{ 
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => alert('Button click works!')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Test Button Click
          </button>
        </div>
      </div>
import { EditSaleForm } from '@/components/sale/EditSaleForm'
import { salesService } from '@/services/sales.service'
import { Sale } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SaleDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    completedSales: 0,
    pendingSales: 0,
    totalCustomers: 0
  })
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchSalesData = async () => {
    try {
      const salesResult = await salesService.fetchSales()
      setSales(salesResult.sales)

      const stats = await salesService.getSalesStatistics()
      setSalesStats({
        totalSales: stats.total_sales || 0,
        completedSales: stats.completed_sales || 0,
        pendingSales: stats.pending_sales || 0,
        totalCustomers: stats.total_customers || 0
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [])

  const handleViewSale = async (sale: Sale) => {
    setSelectedSale(sale)
    setIsViewDialogOpen(true)
  }

  const handleEditSale = async (sale: Sale) => {
    setSelectedSale(sale)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (sale: Sale) => {
    setSelectedSale(sale)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return

    try {
      await salesService.deleteSale(selectedSale.id)
      await fetchSalesData() // Refresh the sales list
      toast({
        title: "Success",
        description: "Sale deleted successfully",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive"
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedSale(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sale Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage sales transactions and customer orders</p>
        </div>
        <NewSaleForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {salesStats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {sales.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats.completedSales}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats.pendingSales}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Unique customers served
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Sale number: {selectedSale?.sale_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Customer:</span>
              <span className="col-span-3">{selectedSale?.customer_name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Phone:</span>
              <span className="col-span-3">{selectedSale?.customer_phone || '-'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Email:</span>
              <span className="col-span-3">{selectedSale?.customer_email || '-'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Amount:</span>
              <span className="col-span-3">LKR {selectedSale?.total_amount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Payment:</span>
              <span className="col-span-3 capitalize">{selectedSale?.payment_method.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Status:</span>
              <span className="col-span-3">
                <Badge variant={
                  selectedSale?.status === 'completed' ? 'default' : 
                  selectedSale?.status === 'pending' ? 'secondary' : 
                  'destructive'
                }>
                  {selectedSale?.status}
                </Badge>
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Notes:</span>
              <span className="col-span-3">{selectedSale?.notes || '-'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      {selectedSale && (
        <EditSaleForm
          sale={selectedSale}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSaleUpdated={fetchSalesData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale
              record and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            View and manage your sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium mb-2">No sales found</p>
                      <p className="text-sm">Create your first sale using the New Sale button above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer_name}</div>
                        {sale.customer_email && (
                          <div className="text-sm text-muted-foreground">{sale.customer_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>LKR {sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        sale.status === 'completed' ? 'default' : 
                        sale.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteClick(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
>>>>>>> 483f8ec9a4073a43c62de95fd888e77f9b5f9d52
    </div>
  )
}

export default SaleDashboard