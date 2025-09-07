import React from 'react'
import { CreateGRNForm } from '@/components/grn/CreateGRNForm'
import { ReleaseCrabBoxesSection } from '@/components/stock/ReleaseCrabBoxesSection'

export const GRNAndRelease = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">GRN & Stock Release</h1>
        <p className="text-muted-foreground">
          Create Goods Received Notes and manage crab box releases with automatic inventory updates.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Create GRN Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create GRN</h2>
          <CreateGRNForm />
        </div>

        {/* Release Crab Boxes Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Release Crab Boxes</h2>
          <ReleaseCrabBoxesSection />
        </div>
      </div>
    </div>
  )
}
