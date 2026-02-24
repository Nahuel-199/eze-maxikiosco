export interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "employee"
  permissions?: string[]
  active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  category_id?: string
  category?: Category
  price: number
  cost?: number
  stock: number
  min_stock: number
  image_url?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: string
  operator_name: string
  opened_by_user_id?: string
  opened_by_user?: User
  closed_by_user_id?: string
  closed_by_user?: User
  user_id: string // Mantener por compatibilidad
  user?: User
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  opened_at: string
  closed_at?: string
  status: "open" | "closed"
  notes?: string
}

export type CashMovementType = "supplier_payment" | "expense" | "adjustment" | "withdrawal"

export interface CashMovement {
  id: string
  cash_register_id: string
  type: CashMovementType
  amount: number
  description: string
  supplier_name?: string
  reference_number?: string
  created_by_name: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface CashRegisterSummary {
  cashRegister: CashRegister
  salesCash: number
  salesCard: number
  salesTransfer: number
  totalSales: number
  totalMovements: number
  expectedAmount: number
  salesCount: number
  movementsCount: number
}

export interface PaymentDetails {
  cash_amount: number
  card_amount: number
  transfer_amount: number
}

export interface Sale {
  id: string
  cash_register_id: string
  user_id: string
  user?: User
  total: number
  payment_method: "cash" | "card" | "transfer" | "mixed"
  payment_details?: PaymentDetails
  created_at: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}
