"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Receipt,
  ArrowDownCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
  Truck,
  Settings,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { getCashRegisterDetail } from "@/lib/actions/cash-register"
import type { CashMovementType } from "@/lib/types"

interface CashRegisterDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegisterId: string | null
}

interface DetailData {
  summary: {
    cashRegister: {
      operator_name: string
      opening_amount: number
      closing_amount?: number
      expected_amount?: number
      difference?: number
      opened_at: string
      closed_at?: string
      status: string
      notes?: string
    }
    salesCash: number
    salesCard: number
    salesTransfer: number
    totalSales: number
    totalMovements: number
    expectedAmount: number
    salesCount: number
    movementsCount: number
  }
  sales: {
    id: string
    total: number
    payment_method: string
    created_at: string
    items: { product_name: string; quantity: number; unit_price: number; subtotal: number }[]
  }[]
  movements: {
    id: string
    type: CashMovementType
    amount: number
    description: string
    supplier_name?: string
    reference_number?: string
    created_by_name: string
    created_at: string
  }[]
  products: { name: string; quantity: number; total: number }[]
}

const MOVEMENT_ICONS: Record<CashMovementType, React.ReactNode> = {
  supplier_payment: <Truck className="h-4 w-4 text-orange-500" />,
  expense: <Receipt className="h-4 w-4 text-red-500" />,
  adjustment: <Settings className="h-4 w-4 text-blue-500" />,
  withdrawal: <Wallet className="h-4 w-4 text-purple-500" />,
}

const MOVEMENT_LABELS: Record<CashMovementType, string> = {
  supplier_payment: "Pago Proveedor",
  expense: "Gasto",
  adjustment: "Ajuste",
  withdrawal: "Retiro",
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4 text-green-600" />,
  card: <CreditCard className="h-4 w-4 text-blue-600" />,
  transfer: <ArrowDownCircle className="h-4 w-4 text-purple-600" />,
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
}

export function CashRegisterDetailDialog({
  open,
  onOpenChange,
  cashRegisterId,
}: CashRegisterDetailDialogProps) {
  const [data, setData] = useState<DetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && cashRegisterId) {
      loadDetail()
    }
  }, [open, cashRegisterId])

  const loadDetail = async () => {
    if (!cashRegisterId) return

    setIsLoading(true)
    try {
      const result = await getCashRegisterDetail(cashRegisterId)
      setData(result as DetailData | null)
    } catch (error) {
      console.error("Error loading detail:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!cashRegisterId) return null

  const summary = data?.summary
  const difference = summary?.cashRegister.difference

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Detalle de Caja</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Información completa del turno de caja
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-muted-foreground">
            No se pudo cargar el detalle
          </div>
        ) : (
          <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary" className="text-xs sm:text-sm">Resumen</TabsTrigger>
              <TabsTrigger value="sales" className="text-xs sm:text-sm">
                Ventas ({summary?.salesCount})
              </TabsTrigger>
              <TabsTrigger value="movements" className="text-xs sm:text-sm">
                Mov. ({summary?.movementsCount})
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs sm:text-sm">Productos</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="summary" className="h-full m-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {/* Operator Info */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Operador</p>
                            <p className="font-semibold">{summary?.cashRegister.operator_name}</p>
                          </div>
                          <Badge
                            variant={
                              summary?.cashRegister.status === "open" ? "default" : "secondary"
                            }
                          >
                            {summary?.cashRegister.status === "open" ? "Abierta" : "Cerrada"}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Apertura</p>
                            <p className="font-medium">
                              {new Date(summary?.cashRegister.opened_at || "").toLocaleString(
                                "es-AR"
                              )}
                            </p>
                          </div>
                          {summary?.cashRegister.closed_at && (
                            <div>
                              <p className="text-muted-foreground">Cierre</p>
                              <p className="font-medium">
                                {new Date(summary.cashRegister.closed_at).toLocaleString("es-AR")}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Totals */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Ventas Total</span>
                          </div>
                          <p className="text-xl font-bold">${summary?.totalSales.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-muted-foreground">Egresos</span>
                          </div>
                          <p className="text-xl font-bold text-red-600">
                            -${summary?.totalMovements.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sales by Payment Method */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-3">Ventas por Método de Pago</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm">
                              <Banknote className="h-4 w-4 text-green-600" />
                              Efectivo
                            </span>
                            <span className="font-medium">${summary?.salesCash.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              Tarjeta
                            </span>
                            <span className="font-medium">${summary?.salesCard.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm">
                              <ArrowDownCircle className="h-4 w-4 text-purple-600" />
                              Transferencia
                            </span>
                            <span className="font-medium">
                              ${summary?.salesTransfer.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cash Balance */}
                    {summary?.cashRegister.status === "closed" && (
                      <Card
                        className={
                          difference === 0
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                            : difference && difference > 0
                              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            {difference === 0 ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {difference === 0
                                ? "Caja Balanceada"
                                : difference && difference > 0
                                  ? "Sobrante"
                                  : "Faltante"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Esperado</p>
                              <p className="font-medium">
                                ${summary?.cashRegister.expected_amount?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Real</p>
                              <p className="font-medium">
                                ${summary?.cashRegister.closing_amount?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Diferencia</p>
                              <p
                                className={`font-bold ${
                                  difference === 0
                                    ? "text-green-600"
                                    : difference && difference > 0
                                      ? "text-blue-600"
                                      : "text-red-600"
                                }`}
                              >
                                {difference && difference > 0 ? "+" : ""}$
                                {Math.abs(difference || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {summary?.cashRegister.notes && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-sm text-muted-foreground">
                                Notas: {summary.cashRegister.notes}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sales" className="h-full m-0">
                <ScrollArea className="h-[400px]">
                  {data.sales.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No hay ventas en este turno
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {data.sales.map((sale) => (
                        <Card key={sale.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {PAYMENT_ICONS[sale.payment_method]}
                                <span className="text-sm font-medium">
                                  {PAYMENT_LABELS[sale.payment_method]}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${sale.total.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(sale.created_at).toLocaleTimeString("es-AR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sale.items.map((item, idx) => (
                                <span key={idx}>
                                  {item.quantity}x {item.product_name}
                                  {idx < sale.items.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="movements" className="h-full m-0">
                <ScrollArea className="h-[400px]">
                  {data.movements.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No hay movimientos en este turno
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {data.movements.map((movement) => (
                        <Card key={movement.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {MOVEMENT_ICONS[movement.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {MOVEMENT_LABELS[movement.type]}
                                  </span>
                                  <span className="font-bold text-red-600">
                                    -${movement.amount.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium truncate">{movement.description}</p>
                                {movement.supplier_name && (
                                  <p className="text-xs text-muted-foreground">
                                    Proveedor: {movement.supplier_name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(movement.created_at).toLocaleTimeString("es-AR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  - {movement.created_by_name}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="products" className="h-full m-0">
                <ScrollArea className="h-[400px]">
                  {data.products.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No hay productos vendidos en este turno
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {data.products.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} unidades
                              </p>
                            </div>
                          </div>
                          <p className="font-bold">${product.total.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
