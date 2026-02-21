"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Loader2, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"
import { getCashRegisterHistory } from "@/lib/actions/cash-register"
import { CashRegisterDetailDialog } from "@/components/cash-register-detail-dialog"
import type { CashRegister } from "@/lib/types"

interface CashRegisterHistoryProps {
  userId: string
  userRole: string
}

export function CashRegisterHistory({ userId, userRole }: CashRegisterHistoryProps) {
  const [history, setHistory] = useState<CashRegister[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [operatorFilter, setOperatorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Detail dialog
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null)

  const loadHistory = async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await getCashRegisterHistory({
        operator_name: operatorFilter || undefined,
        status: statusFilter,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit: 10,
      })
      setHistory(result.items)
      setPagination(result.pagination)
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
    setStatusFilter("all")
    setStartDate("")
    setEndDate("")
    setTimeout(() => loadHistory(1), 0)
  }

  const isAdmin = userRole === "admin"

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Historial de Cajas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Registro de aperturas y cierres anteriores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="operator-filter" className="text-xs">Operador</Label>
              <Input
                id="operator-filter"
                placeholder="Buscar operador..."
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status-filter" className="text-xs">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger id="status-filter" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abiertas</SelectItem>
                  <SelectItem value="closed">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs">Desde</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs">Hasta</Label>
              <Input
                id="end-date"
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
              <div className="md:hidden space-y-3">
                {history.map((register) => (
                  <div key={register.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">{register.operator_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(register.opened_at).toLocaleDateString("es-AR")} -{" "}
                          {new Date(register.opened_at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={register.status === "open" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {register.status === "open" ? "Abierta" : "Cerrada"}
                        </Badge>
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
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Apertura</p>
                        <p className="font-medium">${register.opening_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Cierre</p>
                        <p className="font-medium">
                          {register.closing_amount ? `$${register.closing_amount.toFixed(2)}` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Diferencia</p>
                        {register.difference !== undefined && register.difference !== null ? (
                          <p
                            className={
                              register.difference === 0
                                ? "text-green-600 font-medium"
                                : register.difference > 0
                                  ? "text-blue-600 font-medium"
                                  : "text-red-600 font-medium"
                            }
                          >
                            {register.difference > 0 ? "+" : ""}${register.difference.toFixed(2)}
                          </p>
                        ) : (
                          <p>-</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Apertura</TableHead>
                      <TableHead className="text-right">Cierre</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((register) => (
                      <TableRow key={register.id}>
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
                        <TableCell className="text-right font-medium">
                          ${register.opening_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {register.closing_amount ? `$${register.closing_amount.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {register.difference !== undefined && register.difference !== null ? (
                            <span
                              className={
                                register.difference === 0
                                  ? "text-green-600 font-medium"
                                  : register.difference > 0
                                    ? "text-blue-600 font-medium"
                                    : "text-red-600 font-medium"
                              }
                            >
                              {register.difference > 0 ? "+" : ""}${register.difference.toFixed(2)}
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
