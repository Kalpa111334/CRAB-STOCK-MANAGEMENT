import { StockGrid } from '@/components/stock/StockGrid'

const Stock = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Stock Overview</h1>
        <p className="text-muted-foreground">Complete inventory of crab stock</p>
      </div>
      <StockGrid />
    </div>
  )
}

export default Stock 