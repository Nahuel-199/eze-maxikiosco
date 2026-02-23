"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, CreditCard, BarChart3 } from "lucide-react"
import Link from "next/link"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

interface DashboardCardsProps {
  role: string
  permissions?: string[]
}

export function DashboardCards({ role, permissions }: DashboardCardsProps) {
  const session = { role, permissions }

  const cards = [
    {
      title: "Punto de Venta",
      description: "Realizar ventas y gestionar el carrito",
      icon: ShoppingCart,
      href: "/dashboard/pos",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Caja",
      description: "Apertura y cierre de caja",
      icon: CreditCard,
      href: "/dashboard/cash-register",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  if (hasPermission(session, PERMISSIONS.REPORTS_VIEW)) {
    cards.push({
      title: "Reportes",
      description: "Ver ventas y estadísticas",
      icon: BarChart3,
      href: "/dashboard/reports",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    })
  }

  if (hasPermission(session, PERMISSIONS.PRODUCTS_VIEW)) {
    cards.push({
      title: "Productos",
      description: "Gestionar inventario y categorías",
      icon: Package,
      href: "/dashboard/products",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    })
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full active:scale-[0.98]">
            <CardHeader className="p-4 sm:p-6">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
                <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
              </div>
              <CardTitle className="text-base sm:text-lg">{card.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{card.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
