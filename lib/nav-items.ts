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

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  adminOnly: boolean
  permission?: Permission
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
  },
  {
    label: "Caja",
    href: "/dashboard/cash-register",
    icon: CreditCard,
    adminOnly: false,
  },
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
    adminOnly: false,
    permission: "reports:view",
  },
  {
    label: "Productos",
    href: "/dashboard/products",
    icon: Package,
    adminOnly: false,
    permission: "products:view",
  },
  {
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Auditoría",
    href: "/dashboard/audit",
    icon: ShieldCheck,
    adminOnly: false,
    permission: "audit:view",
  },
]
