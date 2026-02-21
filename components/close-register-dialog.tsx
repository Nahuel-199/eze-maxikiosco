"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Lock, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { getCashRegisterSummary, closeCashRegister } from "@/lib/actions/cash-register"
import { useToast } from "@/hooks/use-toast"
import type { CashRegisterSummary } from "@/lib/types"

interface CloseRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegisterId: string | null
  onSuccess: () => void
}

export function CloseRegisterDialog({
  open,
  onOpenChange,
  cashRegisterId,
  onSuccess
}: CloseRegisterDialogProps) {
  const [closingAmount, setClosingAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && cashRegisterId) {
      loadSummary()
    }
  }, [open, cashRegisterId])

  const loadSummary = async () => {
    if (!cashRegisterId) return

    setIsLoadingSummary(true)
    try {
      const data = await getCashRegisterSummary(cashRegisterId)
      setSummary(data)
    } catch (error) {
      console.error("Error loading summary:", error)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  if (!cashRegisterId) return null

  const expectedAmount = summary?.expectedAmount || 0
  const difference = closingAmount ? Number.parseFloat(closingAmount) - expectedAmount : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number.parseFloat(closingAmount)
    if (isNaN(amount) || amount < 0) {
      return
    }

    setIsLoading(true)

    try {
      const result = await closeCashRegister({
        closing_amount: amount,
        notes: notes || undefined,
      })

      if (result.success) {
        const diff = result.result?.difference || 0
        toast({
          title: "Caja cerrada",
          description: diff === 0
            ? "Caja cerrada correctamente. Balance perfecto."
            : diff > 0
              ? `Caja cerrada con sobrante de $${Math.abs(diff).toFixed(2)}`
              : `Caja cerrada con faltante de $${Math.abs(diff).toFixed(2)}`,
        })
        setClosingAmount("")
        setNotes("")
        setSummary(null)
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo cerrar la caja",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cerrar la caja",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Lock className="h-5 w-5" />
            Cerrar Caja
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Verifica los montos y cierra la caja registradora
          </DialogDescription>
        </DialogHeader>

        {isLoadingSummary ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {summary && (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    Operador: <span className="font-medium text-foreground">{summary.cashRegister.operator_name}</span>
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Apertura</span>
                        <span className="font-medium">${summary.cashRegister.opening_amount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Ventas Efectivo
                        </span>
                        <span className="font-medium">+${summary.salesCash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">Ventas Tarjeta</span>
                        <span className="text-xs">${summary.salesCard.toFixed(2)} (no afecta caja)</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">Ventas Transferencia</span>
                        <span className="text-xs">${summary.salesTransfer.toFixed(2)} (no afecta caja)</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-red-600">
                        <span className="text-sm flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Egresos/Pagos
                        </span>
                        <span className="font-medium">-${summary.totalMovements.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monto Esperado en Caja</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">${expectedAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        = Apertura + Efectivo - Egresos
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <Card>
                      <CardContent className="p-2 sm:p-3">
                        <p className="text-xs text-muted-foreground">Ventas</p>
                        <p className="text-lg font-bold">{summary.salesCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-3">
                        <p className="text-xs text-muted-foreground">Movimientos</p>
                        <p className="text-lg font-bold">{summary.movementsCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="closing-amount" className="text-sm sm:text-base">
                  Monto Real en Caja *
                </Label>
                <Input
                  id="closing-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Cuenta todo el efectivo disponible en la caja</p>
              </div>

              {closingAmount && (
                <Card
                  className={
                    difference === 0
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                      : difference > 0
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  }
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {difference === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : difference > 0 ? (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <p className="text-xs sm:text-sm font-medium">
                        {difference === 0 ? "Caja Balanceada" : difference > 0 ? "Sobrante" : "Faltante"}
                      </p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">${Math.abs(difference).toFixed(2)}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm sm:text-base">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega comentarios sobre el cierre..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!closingAmount || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  "Cerrar Caja"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
