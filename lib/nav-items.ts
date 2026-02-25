import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Package,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/lib/permissions"
import type { Feature } from "@/lib/features"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  adminOnly: boolean
  permission?: Permission
  feature?: Feature
}

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
    permission: "dashboard:view",
  },
  {
    label: "Punto de Venta",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    adminOnly: false,
    feature: "pos",
  },
  {
    label: "Caja",
    href: "/dashboard/cash-register",
    icon: CreditCard,
    adminOnly: false,
    feature: "cash_register",
  },
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
    adminOnly: false,
    permission: "reports:view",
    feature: "reports",
  },
  {
    label: "Productos",
    href: "/dashboard/products",
    icon: Package,
    adminOnly: false,
    permission: "products:view",
    feature: "products",
  },
  {
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    adminOnly: true,
    feature: "users",
  },
  {
    label: "Auditoría",
    href: "/dashboard/audit",
    icon: ShieldCheck,
    adminOnly: false,
    permission: "audit:view",
    feature: "audit",
  },
]
