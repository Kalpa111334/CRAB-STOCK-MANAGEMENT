import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User, Shield, Users, ShoppingCart, Package } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'quality_control':
        return <Users className="h-4 w-4" />
      case 'purchasing':
        return <ShoppingCart className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'text-destructive'
      case 'quality_control':
        return 'text-primary'
      case 'purchasing':
        return 'text-success'
      default:
        return 'text-muted-foreground'
    }
  }

  const getDashboardRoute = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin'
      case 'quality_control':
        return '/quality-control'
      case 'purchasing':
        return '/dashboard/purchasing'
      default:
        return '/auth'
    }
  }

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3" onClick={() => navigate(getDashboardRoute())}>
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center cursor-pointer">
              <span className="text-white text-lg">🦀</span>
            </div>
            <div className="cursor-pointer">
              <h1 className="text-lg font-bold text-foreground">Crab Stock Guardian</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          {/* Dashboard Navigation for Purchasing Role */}
          {user?.role === 'purchasing' && (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant={location.pathname === '/dashboard/purchasing' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => navigate('/dashboard/purchasing')}
              >
                <ShoppingCart className="h-4 w-4" />
                Purchasing
              </Button>
              <Button
                variant={location.pathname === '/quality-control' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => navigate('/quality-control')}
              >
                <Package className="h-4 w-4" />
                Quality Control
              </Button>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <div className="flex items-center gap-1 justify-end">
                {getRoleIcon()}
                <p className={`text-xs capitalize ${getRoleColor()}`}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Dashboard Navigation for Mobile */}
                {user?.role === 'purchasing' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/purchasing')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Purchasing Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/quality-control')}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>Quality Control Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}