"use client"

import {
  Package,
  Tag,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  AlertTriangle,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { DashboardData } from "@/lib/actions/dashboard"

interface DashboardOverviewProps {
  data: DashboardData
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value)
}

function formatDate(dateString: string) {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { stats, topProducts, lowStockProducts, unsoldProducts, recentClosings } = data

  const inventoryCards = [
    {
      title: "Productos Activos",
      value: stats.activeProducts,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Categorías",
      value: stats.activeCategories,
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  const periodCards = [
    {
      title: "Hoy",
      count: stats.periodStats.today.count,
      total: stats.periodStats.today.total,
      icon: CalendarDays,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Semana",
      count: stats.periodStats.week.count,
      total: stats.periodStats.week.total,
      icon: CalendarRange,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Mes",
      count: stats.periodStats.month.count,
      total: stats.periodStats.month.total,
      icon: CalendarClock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {inventoryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0`}
                >
                  <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold truncate">
                    {card.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {periodCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0`}
                >
                  <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-sm sm:text-lg font-bold truncate">
                    {card.count} ventas
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {formatCurrency(card.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cant. Vendida</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell className="text-right">
                        {product.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock + Unsold Products */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Bajo Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos los productos tienen stock suficiente.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName}
                      </p>
                    </div>
                    <Badge
                      variant={product.stock === 0 ? "destructive" : "secondary"}
                      className="shrink-0"
                    >
                      {product.stock} / {product.minStock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unsold Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Sin Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unsoldProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos los productos han registrado ventas.
              </p>
            ) : (
              <div className="space-y-3">
                {unsoldProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Cash Register Closings */}
      {recentClosings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Últimos Cierres de Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClosings.map((closing) => (
                    <TableRow key={closing.id}>
                      <TableCell className="font-medium">
                        {closing.operatorName}
                      </TableCell>
                      <TableCell>{formatDate(closing.closedAt)}</TableCell>
                      <TableCell className="text-right">
                        {closing.salesCount} ({formatCurrency(closing.salesTotal)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(closing.expectedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(closing.closingAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          closing.difference < 0
                            ? "text-red-600"
                            : closing.difference > 0
                              ? "text-green-600"
                              : ""
                        }`}
                      >
                        {closing.difference > 0 ? "+" : ""}
                        {formatCurrency(closing.difference)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
