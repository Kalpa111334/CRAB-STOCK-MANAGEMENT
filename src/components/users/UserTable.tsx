import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { useSweetAlert } from '@/hooks/use-sweet-alert'
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'quality_control' | 'purchasing' | 'sale'
  created_at: string
}

export const UserTable = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const sweetAlert = useSweetAlert()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data as User[] || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      sweetAlert.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (user: User) => {
    const { value: formValues } = await sweetAlert.form({
      title: 'Edit User',
      html: `
        <input id="full_name" class="swal2-input" placeholder="Full Name" value="${user.full_name}">
        <select id="role" class="swal2-select">
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="quality_control" ${user.role === 'quality_control' ? 'selected' : ''}>Quality Control</option>
          <option value="purchasing" ${user.role === 'purchasing' ? 'selected' : ''}>Purchasing</option>
          <option value="sale" ${user.role === 'sale' ? 'selected' : ''}>Sale</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const fullName = (document.getElementById('full_name') as HTMLInputElement).value
        const role = (document.getElementById('role') as HTMLSelectElement).value
        return { full_name: fullName, role }
      }
    })

    if (formValues) {
      try {
        const { error } = await supabase
          .from('users')
          .update(formValues)
          .eq('id', user.id)

        if (error) throw error
        sweetAlert.success('User updated successfully')
        fetchUsers()
      } catch (error) {
        console.error('Error updating user:', error)
        sweetAlert.error('Failed to update user')
      }
    }
  }

  const handleDeleteUser = async (user: User) => {
    const result = await sweetAlert.confirm({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id)

        if (error) throw error
        sweetAlert.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        sweetAlert.error('Failed to delete user')
      }
    }
  }

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'quality_control':
        return 'default'
      case 'purchasing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteUser(user)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 