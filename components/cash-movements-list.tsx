"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Truck,
  Receipt,
  Settings,
  Wallet,
  Trash2,
  Loader2,
  ArrowDownCircle,
  ShoppingCart,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Split,
} from "lucide-react"
import { deleteCashMovement } from "@/lib/actions/cash-movements"
import { useToast } from "@/hooks/use-toast"
import type { CashMovement, CashMovementType, Sale } from "@/lib/types"

interface CashMovementsListProps {
  movements: CashMovement[]
  sales: Sale[]
  isAdmin: boolean
  onMovementDeleted: () => void
}

type TimelineEntry =
  | { kind: "movement"; data: CashMovement; date: Date }
  | { kind: "sale"; data: Sale; date: Date }

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
  cash: <Banknote className="h-4 w-4 text-green-500" />,
  card: <CreditCard className="h-4 w-4 text-blue-500" />,
  transfer: <ArrowRightLeft className="h-4 w-4 text-violet-500" />,
  mixed: <Split className="h-4 w-4 text-orange-500" />,
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Pago Mixto",
}

export function CashMovementsList({
  movements,
  sales,
  isAdmin,
  onMovementDeleted,
}: CashMovementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [
      ...movements.map((m) => ({
        kind: "movement" as const,
        data: m,
        date: new Date(m.created_at),
      })),
      ...sales.map((s) => ({
        kind: "sale" as const,
        data: s,
        date: new Date(s.created_at),
      })),
    ]
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [movements, sales])

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const result = await deleteCashMovement(deleteId)

      if (result.success) {
        toast({
          title: "Movimiento eliminado",
          description: "El movimiento fue eliminado correctamente",
        })
        onMovementDeleted()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo eliminar el movimiento",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el movimiento",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const totalMovements = movements.reduce((sum, m) => sum + m.amount, 0)
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0)

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Movimientos del Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay movimientos registrados en este turno
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Movimientos del Turno
            </CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-green-600">
                +${totalSales.toFixed(2)}
              </span>
              {totalMovements > 0 && (
                <span className="font-bold text-red-600">
                  -${totalMovements.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs font-normal">
              {sales.length} {sales.length === 1 ? "venta" : "ventas"}
            </Badge>
            {movements.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {movements.length} {movements.length === 1 ? "egreso" : "egresos"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {timeline.map((entry) => {
                if (entry.kind === "sale") {
                  const sale = entry.data
                  const itemCount = sale.items?.length || 0
                  const itemsSummary = sale.items
                    ?.slice(0, 3)
                    .map((i) => `${i.quantity}x ${i.product_name}`)
                    .join(", ")
                  const hasMore = itemCount > 3

                  return (
                    <div
                      key={`sale-${sale.id}`}
                      className="flex items-start gap-3 p-3 hover:bg-muted/50"
                    >
                      <div className="mt-0.5 p-1 bg-green-100 dark:bg-green-900/30 rounded">
                        <ShoppingCart className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">
                            Venta
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {PAYMENT_ICONS[sale.payment_method]}
                            {PAYMENT_LABELS[sale.payment_method]}
                          </span>
                        </div>
                        <p className="text-sm truncate text-muted-foreground">
                          {itemsSummary}
                          {hasMore && ` (+${itemCount - 3} más)`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.date.toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {itemCount > 0 && ` - ${itemCount} ${itemCount === 1 ? "producto" : "productos"}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        +${sale.total.toFixed(2)}
                      </span>
                    </div>
                  )
                }

                const movement = entry.data
                return (
                  <div
                    key={`mov-${movement.id}`}
                    className="flex items-start gap-3 p-3 hover:bg-muted/50"
                  >
                    <div className="mt-0.5 p-1 bg-red-100 dark:bg-red-900/30 rounded">
                      {MOVEMENT_ICONS[movement.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">
                          {MOVEMENT_LABELS[movement.type]}
                        </span>
                        {movement.supplier_name && (
                          <span className="text-xs text-muted-foreground">
                            - {movement.supplier_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {movement.description}
                      </p>
                      {movement.reference_number && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {movement.reference_number}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {entry.date.toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {movement.created_by_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">
                        -${movement.amount.toFixed(2)}
                      </span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteId(movement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar movimiento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar este movimiento? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
