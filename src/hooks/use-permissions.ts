import { useAuth } from '@/contexts/AuthContext'

type Permission = 'add_crab' | 'record_dead_crab' | 'generate_report' | 'share_status'

const rolePermissions = {
  admin: ['add_crab', 'record_dead_crab', 'generate_report', 'share_status'],
  quality_control: ['add_crab', 'record_dead_crab', 'generate_report', 'share_status'],
  purchasing: ['add_crab', 'generate_report', 'share_status'], // Purchasing can add crabs but not record dead ones
  sale: ['generate_report', 'share_status']
} as Record<string, Permission[]>

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return rolePermissions[user.role]?.includes(permission) ?? false
  }

  return {
    hasPermission,
    canAddCrab: hasPermission('add_crab'),
    canRecordDeadCrab: hasPermission('record_dead_crab'),
    canGenerateReport: hasPermission('generate_report'),
    canShareStatus: hasPermission('share_status')
  }
} 