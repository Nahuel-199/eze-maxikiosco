"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Package,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react"
import { getCashRegisterHistory } from "@/lib/actions/cash-register"
import { getAuditLogs } from "@/lib/actions/audit-log"
import type { GetAuditLogsResult, AuditLogEntry } from "@/lib/actions/audit-log"
import type { AuditAction } from "@/lib/models"
import { CashRegisterDetailDialog } from "@/components/cash-register-detail-dialog"
import type { CashRegister } from "@/lib/types"

function CashRegisterTab() {
  const [history, setHistory] = useState<CashRegister[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  })

  const [operatorFilter, setOperatorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("closed")
  const [differenceFilter, setDifferenceFilter] = useState<"all" | "balanced" | "surplus" | "shortage">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null)

  const [stats, setStats] = useState({
    totalRegisters: 0,
    balanced: 0,
    withShortage: 0,
    withSurplus: 0,
    totalShortage: 0,
    totalSurplus: 0,
  })

  const loadHistory = async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await getCashRegisterHistory({
        operator_name: operatorFilter || undefined,
        status: statusFilter,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit: 15,
      })

      let filteredItems = result.items
      if (differenceFilter !== "all") {
        filteredItems = result.items.filter((item) => {
          if (item.difference === undefined || item.difference === null) return false
          if (differenceFilter === "balanced") return item.difference === 0
          if (differenceFilter === "shortage") return item.difference < 0
          if (differenceFilter === "surplus") return item.difference > 0
          return true
        })
      }

      setHistory(filteredItems)
      setPagination(result.pagination)

      const closedRegisters = result.items.filter((r) => r.status === "closed")
      const balanced = closedRegisters.filter(
        (r) => r.difference !== undefined && r.difference === 0
      ).length
      const withShortage = closedRegisters.filter(
        (r) => r.difference !== undefined && r.difference < 0
      )
      const withSurplus = closedRegisters.filter(
        (r) => r.difference !== undefined && r.difference > 0
      )

      setStats({
        totalRegisters: closedRegisters.length,
        balanced,
        withShortage: withShortage.length,
        withSurplus: withSurplus.length,
        totalShortage: withShortage.reduce((sum, r) => sum + Math.abs(r.difference || 0), 0),
        totalSurplus: withSurplus.reduce((sum, r) => sum + (r.difference || 0), 0),
      })
    } catch (error) {
      console.error("Error loading history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory(1)
  }, [])

  const handleSearch = () => {
    loadHistory(1)
  }

  const handleClearFilters = () => {
    setOperatorFilter("")
    setStatusFilter("closed")
    setDifferenceFilter("all")
    setStartDate("")
    setEndDate("")
    setTimeout(() => loadHistory(1), 0)
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Balanceadas</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.balanced}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">de {stats.totalRegisters} cajas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Con Faltante</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.withShortage}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Total: -${stats.totalShortage.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Con Sobrante</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.withSurplus}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Total: +${stats.totalSurplus.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Con Diferencia</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              {stats.withShortage + stats.withSurplus}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {stats.totalRegisters > 0
                ? `${(
                    ((stats.withShortage + stats.withSurplus) / stats.totalRegisters) *
                    100
                  ).toFixed(1)}% del total`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Historial de Cajas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Todas las cajas registradoras con sus diferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label htmlFor="operator-filter" className="text-xs">
                Operador
              </Label>
              <Input
                id="operator-filter"
                placeholder="Buscar operador..."
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status-filter" className="text-xs">
                Estado
              </Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger id="status-filter" className="h-9">
                  <SelectValue placeholder="Cerradas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abiertas</SelectItem>
                  <SelectItem value="closed">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="difference-filter" className="text-xs">
                Diferencia
              </Label>
              <Select
                value={differenceFilter}
                onValueChange={(v) => setDifferenceFilter(v as any)}
              >
                <SelectTrigger id="difference-filter" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="balanced">Balanceadas</SelectItem>
                  <SelectItem value="shortage">Con faltante</SelectItem>
                  <SelectItem value="surplus">Con sobrante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cr-start-date" className="text-xs">
                Desde
              </Label>
              <Input
                id="cr-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cr-end-date" className="text-xs">
                Hasta
              </Label>
              <Input
                id="cr-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay registros de cajas</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="lg:hidden space-y-3">
                {history.map((register) => (
                  <div
                    key={register.id}
                    className={`border rounded-lg p-4 ${
                      register.difference !== undefined && register.difference !== null
                        ? register.difference === 0
                          ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900"
                          : register.difference < 0
                            ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900"
                            : "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">{register.operator_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(register.opened_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {register.difference !== undefined && register.difference !== null && (
                          <Badge
                            variant="outline"
                            className={
                              register.difference === 0
                                ? "border-green-500 text-green-700"
                                : register.difference > 0
                                  ? "border-blue-500 text-blue-700"
                                  : "border-red-500 text-red-700"
                            }
                          >
                            {register.difference === 0
                              ? "OK"
                              : register.difference > 0
                                ? `+$${register.difference.toFixed(2)}`
                                : `-$${Math.abs(register.difference).toFixed(2)}`}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedRegisterId(register.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Esperado</p>
                        <p className="font-medium">
                          {register.expected_amount
                            ? `$${register.expected_amount.toFixed(2)}`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Real</p>
                        <p className="font-medium">
                          {register.closing_amount
                            ? `$${register.closing_amount.toFixed(2)}`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Apertura</TableHead>
                      <TableHead className="text-right">Esperado</TableHead>
                      <TableHead className="text-right">Real</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((register) => (
                      <TableRow
                        key={register.id}
                        className={
                          register.difference !== undefined && register.difference !== null
                            ? register.difference === 0
                              ? "bg-green-50/30 dark:bg-green-950/10"
                              : register.difference < 0
                                ? "bg-red-50/30 dark:bg-red-950/10"
                                : "bg-blue-50/30 dark:bg-blue-950/10"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">{register.operator_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(register.opened_at).toLocaleDateString("es-AR")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(register.opened_at).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {register.closed_at &&
                                ` - ${new Date(register.closed_at).toLocaleTimeString("es-AR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${register.opening_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {register.expected_amount
                            ? `$${register.expected_amount.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {register.closing_amount
                            ? `$${register.closing_amount.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {register.difference !== undefined && register.difference !== null ? (
                            <span
                              className={`font-bold ${
                                register.difference === 0
                                  ? "text-green-600"
                                  : register.difference > 0
                                    ? "text-blue-600"
                                    : "text-red-600"
                              }`}
                            >
                              {register.difference === 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                  OK
                                </span>
                              ) : (
                                <>
                                  {register.difference > 0 ? "+" : ""}$
                                  {register.difference.toFixed(2)}
                                </>
                              )}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={register.status === "open" ? "default" : "secondary"}>
                            {register.status === "open" ? "Abierta" : "Cerrada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRegisterId(register.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => loadHistory(pagination.page - 1)}
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
                      onClick={() => loadHistory(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CashRegisterDetailDialog
        open={!!selectedRegisterId}
        onOpenChange={(open) => !open && setSelectedRegisterId(null)}
        cashRegisterId={selectedRegisterId}
      />
    </>
  )
}

const ACTION_BADGES: Record<AuditAction, { label: string; className: string }> = {
  create: {
    label: "Creación",
    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  update: {
    label: "Edición",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  stock_update: {
    label: "Cambio de Stock",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  delete: {
    label: "Eliminación",
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
}

function ActionBadge({ action }: { action: AuditAction }) {
  const config = ACTION_BADGES[action]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

function ChangeDetail({ entry }: { entry: AuditLogEntry }) {
  if (entry.action === "create") {
    return <span className="text-sm text-muted-foreground">Creó el producto &quot;{entry.entity_name}&quot;</span>
  }

  if (entry.action === "delete") {
    return <span className="text-sm text-muted-foreground">Eliminó el producto &quot;{entry.entity_name}&quot;</span>
  }

  if (!entry.changes || entry.changes.length === 0) {
    return <span className="text-sm text-muted-foreground">Sin cambios detallados</span>
  }

  return (
    <div className="space-y-1">
      {entry.changes.map((change, i) => {
        const isStockChange = change.field === "Stock"
        const from = change.from ?? "-"
        const to = change.to ?? "-"

        if (isStockChange) {
          const diff = Number(to) - Number(from)
          const isDecrease = diff < 0
          return (
            <div
              key={i}
              className={`text-sm font-medium ${
                isDecrease
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              Stock: {from} → {to} ({isDecrease ? "" : "+"}{diff})
            </div>
          )
        }

        return (
          <div key={i} className="text-sm text-muted-foreground">
            {change.field}: {String(from)} → {String(to)}
          </div>
        )
      })}
    </div>
  )
}

function ProductAuditTab() {
  const [data, setData] = useState<GetAuditLogsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all")
  const [entityTypeFilter, setEntityTypeFilter] = useState<"all" | "product" | "category">("all")
  const [searchFilter, setSearchFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadLogs = async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await getAuditLogs({
        page,
        limit: 20,
        action: actionFilter === "all" ? "" : actionFilter,
        entity_type: entityTypeFilter === "all" ? "" : entityTypeFilter,
        search: searchFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      setData(result)
    } catch (error) {
      console.error("Error loading audit logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(1)
  }, [])

  const handleSearch = () => {
    loadLogs(1)
  }

  const handleClearFilters = () => {
    setActionFilter("all")
    setEntityTypeFilter("all")
    setSearchFilter("")
    setStartDate("")
    setEndDate("")
    setTimeout(() => loadLogs(1), 0)
  }

  const stats = data?.stats || { total: 0, creates: 0, updates: 0, deletes: 0, stock_updates: 0 }
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
  const items = data?.items || []

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Creaciones</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.creates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Ediciones</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.updates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Eliminaciones</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.deletes}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpDown className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Cambios Stock</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.stock_updates}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Registro de Actividad</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Historial de cambios en productos y categorías
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label htmlFor="audit-search" className="text-xs">
                Producto/Categoría
              </Label>
              <Input
                id="audit-search"
                placeholder="Buscar por nombre..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="action-filter" className="text-xs">
                Acción
              </Label>
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as any)}>
                <SelectTrigger id="action-filter" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Creación</SelectItem>
                  <SelectItem value="update">Edición</SelectItem>
                  <SelectItem value="stock_update">Cambio de Stock</SelectItem>
                  <SelectItem value="delete">Eliminación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="entity-type-filter" className="text-xs">
                Tipo
              </Label>
              <Select value={entityTypeFilter} onValueChange={(v) => setEntityTypeFilter(v as any)}>
                <SelectTrigger id="entity-type-filter" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="category">Categoría</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-start-date" className="text-xs">
                Desde
              </Label>
              <Input
                id="audit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audit-end-date" className="text-xs">
                Hasta
              </Label>
              <Input
                id="audit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay registros de actividad</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="lg:hidden space-y-3">
                {items.map((entry) => (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 ${
                      entry.action === "stock_update"
                        ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900"
                        : entry.action === "delete"
                          ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900"
                          : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{entry.entity_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("es-AR")}{" "}
                          {new Date(entry.createdAt).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <ActionBadge action={entry.action} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Por: {entry.user_name}
                    </p>
                    <ChangeDetail entry={entry} />
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={
                          entry.action === "stock_update"
                            ? "bg-amber-50/30 dark:bg-amber-950/10"
                            : entry.action === "delete"
                              ? "bg-red-50/30 dark:bg-red-950/10"
                              : ""
                        }
                      >
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="font-medium text-sm">
                              {new Date(entry.createdAt).toLocaleDateString("es-AR")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{entry.user_name}</p>
                            <p className="text-xs text-muted-foreground">{entry.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={entry.action} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{entry.entity_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{entry.entity_type === "product" ? "Producto" : "Categoría"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <ChangeDetail entry={entry} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => loadLogs(pagination.page - 1)}
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
                      onClick={() => loadLogs(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export function AuditPanel() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7" />
          Panel de Auditoría
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Control y seguimiento de operaciones del negocio
        </p>
      </div>

      <Tabs defaultValue="cash-register" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cash-register">Caja</TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash-register">
          <CashRegisterTab />
        </TabsContent>

        <TabsContent value="products">
          <ProductAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
