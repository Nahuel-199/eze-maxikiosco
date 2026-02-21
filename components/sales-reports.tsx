"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react"
import {
  getSalesHistory,
  getSalesForExport,
  type SalesHistoryResult,
  type SalesHistoryFilters,
  type SaleHistoryItem,
} from "@/lib/actions/sales-history"
import { exportSalesToExcel } from "@/lib/export-sales"

interface SalesReportsProps {
  initialData?: SalesHistoryResult
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-800",
  card: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value)
}

function formatDayHeader(dateStr: string) {
  const date = new Date(dateStr)
  const dayName = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date)
  const formatted = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formatted}`
}

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

interface DayGroup {
  dateKey: string
  label: string
  sales: SaleHistoryItem[]
  dayTotal: number
  dayCount: number
}

function groupByDay(sales: SaleHistoryItem[]): DayGroup[] {
  const groups = new Map<string, SaleHistoryItem[]>()

  for (const sale of sales) {
    const dateKey = new Date(sale.createdAt).toLocaleDateString("es-AR")
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(sale)
  }

  return Array.from(groups.entries()).map(([dateKey, groupSales]) => ({
    dateKey,
    label: formatDayHeader(groupSales[0].createdAt),
    sales: groupSales,
    dayTotal: groupSales.reduce((sum, s) => sum + s.total, 0),
    dayCount: groupSales.length,
  }))
}

export function SalesReports({ initialData }: SalesReportsProps) {
  const [data, setData] = useState<SalesHistoryResult | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isExporting, setIsExporting] = useState(false)

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("all")
  const [productName, setProductName] = useState("")

  const currentFilters = (): SalesHistoryFilters => ({
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    payment_method: paymentMethod as SalesHistoryFilters["payment_method"],
    product_name: productName || undefined,
  })

  const loadData = async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await getSalesHistory({
        ...currentFilters(),
        page,
        limit: 20,
      })
      setData(result)
    } catch (error) {
      console.error("Error loading sales:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) {
      loadData(1)
    }
  }, [])

  const handleSearch = () => {
    loadData(1)
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPaymentMethod("all")
    setProductName("")
    setTimeout(() => loadData(1), 0)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await getSalesForExport(currentFilters())
      if (rows.length === 0) {
        return
      }
      const datePart = startDate && endDate
        ? `${startDate}_a_${endDate}`
        : new Date().toLocaleDateString("es-AR").replace(/\//g, "-")
      exportSalesToExcel(rows, `ventas_${datePart}`)
    } catch (error) {
      console.error("Error exporting:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary || { totalAmount: 0, count: 0, avgTicket: 0, productsSold: 0 }
  const dayGroups = data ? groupByDay(data.items) : []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }

  const summaryCards = [
    {
      title: "Total Ventas",
      value: formatCurrency(summary.totalAmount),
      icon: DollarSign,
    },
    {
      title: "Transacciones",
      value: summary.count.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(summary.avgTicket),
      icon: TrendingUp,
    },
    {
      title: "Productos Vendidos",
      value: summary.productsSold.toString(),
      icon: Package,
    },
  ]

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
          Reportes de Ventas
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Historial detallado con filtros y exportación
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs">
                Desde
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs">
                Hasta
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-method" className="text-xs">
                Método de Pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-search" className="text-xs">
                Producto
              </Label>
              <Input
                id="product-search"
                placeholder="Buscar producto..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || !data || data.items.length === 0}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay ventas registradas</p>
              <p className="text-sm mt-1">
                Ajustá los filtros o esperá a que se realicen ventas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((group) => (
            <Card key={group.dateKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex flex-wrap items-center gap-2">
                  <span>{group.label}</span>
                  <span className="text-muted-foreground font-normal">
                    — {group.dayCount} {group.dayCount === 1 ? "venta" : "ventas"} —{" "}
                    {formatCurrency(group.dayTotal)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-3">
                  {group.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {formatTime(sale.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${PAYMENT_COLORS[sale.payment_method] || ""}`}
                          >
                            {PAYMENT_LABELS[sale.payment_method]}
                          </Badge>
                          <span className="font-bold text-sm">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs text-muted-foreground"
                          >
                            <span>
                              {item.product_name} x{item.quantity}
                            </span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Hora</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead className="w-32">Método</TableHead>
                        <TableHead className="text-right w-28">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {formatTime(sale.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.product_name}{" "}
                                  <span className="text-muted-foreground">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${PAYMENT_COLORS[sale.payment_method] || ""}`}
                            >
                              {PAYMENT_LABELS[sale.payment_method]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(sale.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => loadData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => loadData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
