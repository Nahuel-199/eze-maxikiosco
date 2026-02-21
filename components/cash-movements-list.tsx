"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { deleteCashMovement } from "@/lib/actions/cash-movements"
import { useToast } from "@/hooks/use-toast"
import type { CashMovement, CashMovementType } from "@/lib/types"

interface CashMovementsListProps {
  movements: CashMovement[]
  isAdmin: boolean
  onMovementDeleted: () => void
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

export function CashMovementsList({
  movements,
  isAdmin,
  onMovementDeleted
}: CashMovementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

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

  if (movements.length === 0) {
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
            <span className="text-sm font-bold text-red-600">
              -${totalMovements.toFixed(2)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[300px]">
            <div className="divide-y">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    {MOVEMENT_ICONS[movement.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
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
                      {new Date(movement.created_at).toLocaleTimeString("es-AR", {
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
              ))}
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
