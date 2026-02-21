"use client"

import { useState } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { createSale } from "@/lib/actions/sales"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "@/lib/types"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  total: number
  userId: string
  cashRegisterId: string
  onComplete: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  cart,
  total,
  userId,
  cashRegisterId,
  onComplete
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash")
  const [amountReceived, setAmountReceived] = useState("")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const change = paymentMethod === "cash" ? Math.max(0, Number.parseFloat(amountReceived || "0") - total) : 0

  const handlePayment = async () => {
    setProcessing(true)
    setError(null)

    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: Number((item.product.price * item.quantity).toFixed(2)),
      }))

      const result = await createSale({
        items,
        total: Number(total.toFixed(2)),
        payment_method: paymentMethod,
      })

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Venta completada",
          description: `Venta de $${total.toFixed(2)} registrada correctamente`,
        })

        setTimeout(() => {
          setSuccess(false)
          setAmountReceived("")
          setError(null)
          onComplete()
          onOpenChange(false)
        }, 2000)
      } else {
        setError(result.error || "Error al procesar la venta")
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo procesar la venta",
        })
      }
    } catch (err) {
      setError("Error inesperado al procesar la venta")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al procesar la venta",
      })
    } finally {
      setProcessing(false)
    }
  }

  const canProcess = cart.length > 0 && (paymentMethod !== "cash" || Number.parseFloat(amountReceived || "0") >= total)

  const handleClose = (open: boolean) => {
    if (!processing) {
      setError(null)
      onOpenChange(open)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
        {success ? (
          <div className="py-8 sm:py-12 text-center">
            <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Venta Completada</h2>
            <p className="text-sm sm:text-base text-muted-foreground">La venta se registró exitosamente</p>
            {paymentMethod === "cash" && change > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">Vuelto:</p>
                <p className="text-2xl font-bold text-green-600">${change.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Procesar Pago</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Selecciona el método de pago y completa la transacción
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                  <CardContent className="p-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-lg">Total a pagar:</span>
                    <span className="font-bold text-primary text-xl sm:text-2xl">${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Método de pago</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "cash" | "card" | "transfer")}
                  disabled={processing}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer text-sm sm:text-base">
                      Efectivo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer text-sm sm:text-base">
                      Tarjeta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="cursor-pointer text-sm sm:text-base">
                      Transferencia
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "cash" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm sm:text-base">Monto recibido</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      disabled={processing}
                      autoFocus
                    />
                  </div>

                  {amountReceived && Number.parseFloat(amountReceived) >= total && (
                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-900 dark:text-green-100 text-sm sm:text-base">
                            Vuelto:
                          </span>
                          <span className="font-bold text-green-900 dark:text-green-100 text-lg sm:text-xl">
                            ${change.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={processing}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!canProcess || processing}
                className="w-full sm:w-auto"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pago"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
