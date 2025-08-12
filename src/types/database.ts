// Local type definitions for the application
// These complement the auto-generated Supabase types

export interface Supplier {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  status: string
  rating: number
  created_at: string
  updated_at: string
}

export interface CrabCategory {
  value: 'Boil' | 'Large' | 'XL' | 'XXL' | 'Jumbo'
  label: string
}

export interface CrabStatus {
  value: string
  label: string
}

export interface HealthStatus {
  value: 'healthy' | 'damaged'
  label: string
}

export interface ReportType {
  value: 'TSF' | 'Dutch_Trails'
  label: string
}

export interface UserRole {
  value: 'admin' | 'quality_control' | 'purchasing' | 'sale'
  label: string
}

export interface Activity {
  id: string
  created_at: string
  type: 'add' | 'update' | 'delete' | 'damage'
  message: string
  user_id: string
}

export interface SystemAlert {
  id: string
  created_at: string
  title: string
  message: string
  severity: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'quality_control' | 'purchasing' | 'sale'
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  date: string
  delivery_date: string
  total_amount: number
  supplier_details: any
  items: any
  created_by: string
  created_at: string
  updated_at: string
  order_number: string
  supplier_name: string
  currency: string
  status: string
  notes: string | null
  payment_terms: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  date: string
  total_amount: number
<<<<<<< HEAD
  payment_method: string
  notes: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
  items?: any
=======
  payment_method: 'cash' | 'credit_card' | 'bank_transfer'
  notes: string | null
  status: 'pending' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
>>>>>>> 483f8ec9a4073a43c62de95fd888e77f9b5f9d52
}

export interface PurchaseStats {
  total_amount: number
  avg_unit_price: number
  total_quantity: number
  order_count: number
  month: string
  monthly_total: number
  previous_monthly_total: number
  monthly_orders: number
  active_suppliers: number
  average_cost_per_kg: number
  previous_average_cost: number
}