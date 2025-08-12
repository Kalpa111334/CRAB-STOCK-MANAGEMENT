import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/integrations/supabase/client'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { Loader2, Plus, Star, Trash2, Edit } from 'lucide-react'
import { Supplier } from '@/types/database'

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const sweetAlert = useSweetAlert()

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      sweetAlert.error('Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleAddSupplier = async () => {
    const { value: formValues } = await sweetAlert.form({
      title: 'Add New Supplier',
      html: `
        <input id="name" class="swal2-input" placeholder="Supplier Name">
        <input id="contact_person" class="swal2-input" placeholder="Contact Person">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('name') as HTMLInputElement).value
        const contactPerson = (document.getElementById('contact_person') as HTMLInputElement).value
        return { name, contact_person: contactPerson }
      }
    })

    if (formValues) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            name: formValues.name,
            contact_person: formValues.contact_person,
            phone: '',
            email: '',
            address: '',
            status: 'active',
            rating: 5.0
          }])

        if (error) throw error

        sweetAlert.success('Supplier added successfully')
        fetchSuppliers()
      } catch (error) {
        console.error('Error adding supplier:', error)
        sweetAlert.error('Failed to add supplier')
      }
    }
  }

  const handleEditSupplier = async (supplier: Supplier) => {
    const { value: formValues } = await sweetAlert.form({
      title: 'Edit Supplier',
      html: `
        <input id="name" class="swal2-input" value="${supplier.name}" placeholder="Supplier Name">
        <input id="contact_person" class="swal2-input" value="${supplier.contact_person}" placeholder="Contact Person">
        <input id="rating" class="swal2-input" type="number" min="0" max="5" step="0.1" value="${supplier.rating}" placeholder="Rating">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('name') as HTMLInputElement).value
        const contactPerson = (document.getElementById('contact_person') as HTMLInputElement).value
        const rating = parseFloat((document.getElementById('rating') as HTMLInputElement).value)
        return { name, contact_person: contactPerson, rating }
      }
    })

    if (formValues) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .update({
            name: formValues.name,
            contact_person: formValues.contact_person,
            rating: formValues.rating
          })
          .eq('id', supplier.id)

        if (error) throw error

        sweetAlert.success('Supplier updated successfully')
        fetchSuppliers()
      } catch (error) {
        console.error('Error updating supplier:', error)
        sweetAlert.error('Failed to update supplier')
      }
    }
  }

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('suppliers')
        .update({ status: newStatus })
        .eq('id', supplier.id)

      if (error) throw error

      sweetAlert.success(`Supplier ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      fetchSuppliers()
    } catch (error) {
      console.error('Error updating supplier status:', error)
      sweetAlert.error('Failed to update supplier status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Supplier List</h2>
          <p className="text-sm text-muted-foreground">Manage your suppliers and their details</p>
        </div>
        <Button onClick={handleAddSupplier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {supplier.rating.toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {supplier.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={supplier.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(supplier)}
                      >
                        {supplier.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No suppliers found. Add your first supplier to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SupplierManagement