import { useState } from 'react'
import { UserTable } from '@/components/users/UserTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { supabase } from '@/integrations/supabase/client'

const Users = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const sweetAlert = useSweetAlert()

  const handleAddUser = async () => {
    const { value: formValues } = await sweetAlert.form({
      title: 'Add New User',
      html: `
        <input id="email" class="swal2-input" placeholder="Email">
        <input id="full_name" class="swal2-input" placeholder="Full Name">
        <select id="role" class="swal2-select">
          <option value="quality_control">Quality Control</option>
          <option value="purchasing">Purchasing</option>
          <option value="admin">Admin</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const email = (document.getElementById('email') as HTMLInputElement).value
        const fullName = (document.getElementById('full_name') as HTMLInputElement).value
        const role = (document.getElementById('role') as HTMLSelectElement).value
        return { email, full_name: fullName, role }
      }
    })

    if (formValues) {
      try {
        // First, create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formValues.email,
          password: Math.random().toString(36).slice(-8), // Generate a random password
          options: {
            data: {
              full_name: formValues.full_name,
              role: formValues.role
            }
          }
        })

        if (authError) throw authError

        // Then create the user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user?.id,
            email: formValues.email,
            full_name: formValues.full_name,
            role: formValues.role
          }])

        if (profileError) throw profileError

        sweetAlert.success('User created successfully. A confirmation email has been sent.')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        console.error('Error creating user:', error)
        sweetAlert.error('Failed to create user')
      }
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UserTable key={refreshKey} />
    </div>
  )
}

export default Users 