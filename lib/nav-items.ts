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

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  adminOnly: boolean
}

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: true,
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
    adminOnly: true,
  },
  {
    label: "Productos",
    href: "/dashboard/products",
    icon: Package,
    adminOnly: true,
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
    adminOnly: true,
  },
]
