"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Split,
} from "lucide-react"
import { createSale } from "@/lib/actions/sales"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "@/lib/types"

type PaymentMethod = "cash" | "card" | "transfer" | "mixed"
type MixedSecondMethod = "card" | "transfer"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  total: number
  userId: string
  cashRegisterId: string
  onComplete: () => void
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "cash", label: "Efectivo", icon: <Banknote className="h-5 w-5" />, color: "text-green-600 border-green-600 bg-green-50 dark:bg-green-950/30" },
  { value: "card", label: "Tarjeta", icon: <CreditCard className="h-5 w-5" />, color: "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { value: "transfer", label: "Transferencia", icon: <ArrowRightLeft className="h-5 w-5" />, color: "text-violet-600 border-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  { value: "mixed", label: "Pago Mixto", icon: <Split className="h-5 w-5" />, color: "text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/30" },
]

export function PaymentDialog({
  open,
  onOpenChange,
  cart,
  total,
  userId,
  cashRegisterId,
  onComplete,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [amountReceived, setAmountReceived] = useState("")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Mixed payment state
  const [mixedCashAmount, setMixedCashAmount] = useState("")
  const [mixedSecondMethod, setMixedSecondMethod] = useState<MixedSecondMethod>("card")
  const [mixedAmountReceived, setMixedAmountReceived] = useState("")

  const mixedCash = Number.parseFloat(mixedCashAmount || "0")
  const mixedSecondAmount = useMemo(() => {
    const cash = Number.parseFloat(mixedCashAmount || "0")
    return Math.max(0, Number((total - cash).toFixed(2)))
  }, [mixedCashAmount, total])

  const mixedChange = useMemo(() => {
    const received = Number.parseFloat(mixedAmountReceived || "0")
    return Math.max(0, Number((received - mixedCash).toFixed(2)))
  }, [mixedAmountReceived, mixedCash])

  const change =
    paymentMethod === "cash"
      ? Math.max(0, Number.parseFloat(amountReceived || "0") - total)
      : 0

  // Reset mixed state when switching methods
  useEffect(() => {
    if (paymentMethod !== "mixed") {
      setMixedCashAmount("")
      setMixedSecondMethod("card")
      setMixedAmountReceived("")
    }
  }, [paymentMethod])

  const canProcess = useMemo(() => {
    if (cart.length === 0) return false

    if (paymentMethod === "cash") {
      return Number.parseFloat(amountReceived || "0") >= total
    }

    if (paymentMethod === "mixed") {
      const cash = Number.parseFloat(mixedCashAmount || "0")
      if (cash <= 0 || cash >= total) return false
      if (mixedSecondAmount <= 0) return false
      const received = Number.parseFloat(mixedAmountReceived || "0")
      if (received < cash) return false
      return true
    }

    return true
  }, [cart.length, paymentMethod, amountReceived, total, mixedCashAmount, mixedSecondAmount, mixedAmountReceived])

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

      const saleData: Parameters<typeof createSale>[0] = {
        items,
        total: Number(total.toFixed(2)),
        payment_method: paymentMethod,
      }

      if (paymentMethod === "mixed") {
        saleData.payment_details = {
          cash_amount: Number(mixedCash.toFixed(2)),
          card_amount: mixedSecondMethod === "card" ? Number(mixedSecondAmount.toFixed(2)) : 0,
          transfer_amount: mixedSecondMethod === "transfer" ? Number(mixedSecondAmount.toFixed(2)) : 0,
        }
      }

      const result = await createSale(saleData)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Venta completada",
          description: `Venta de $${total.toFixed(2)} registrada correctamente`,
        })

        setTimeout(() => {
          setSuccess(false)
          setAmountReceived("")
          setMixedCashAmount("")
          setMixedAmountReceived("")
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

  const handleClose = (open: boolean) => {
    if (!processing) {
      setError(null)
      onOpenChange(open)
    }
  }

  const showChange = paymentMethod === "cash" && change > 0
  const showMixedChange = paymentMethod === "mixed" && mixedChange > 0
  const needsDetails = paymentMethod === "cash" || paymentMethod === "mixed"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md lg:max-w-2xl p-4 sm:p-6">
        {success ? (
          <div className="py-8 sm:py-12 text-center">
            <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Venta Completada</h2>
            <p className="text-sm sm:text-base text-muted-foreground">La venta se registró exitosamente</p>
            {showChange && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg inline-block">
                <p className="text-sm text-green-700 dark:text-green-300">Vuelto:</p>
                <p className="text-2xl font-bold text-green-600">${change.toFixed(2)}</p>
              </div>
            )}
            {showMixedChange && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg inline-block">
                <p className="text-sm text-green-700 dark:text-green-300">Vuelto (efectivo):</p>
                <p className="text-2xl font-bold text-green-600">${mixedChange.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Procesar Pago</DialogTitle>
              <DialogDescription>
                Selecciona el método de pago y completa la transacción
              </DialogDescription>
            </DialogHeader>

            {/* Total */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">Total a pagar:</span>
                  <span className="font-bold text-primary text-2xl">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Two-column layout on desktop */}
            <div className={`grid gap-4 ${needsDetails ? "lg:grid-cols-2" : ""}`}>
              {/* Payment method selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Método de pago</Label>
                <div className="grid grid-cols-2 gap-2">
                  {METHOD_OPTIONS.map((option) => {
                    const selected = paymentMethod === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={processing}
                        onClick={() => setPaymentMethod(option.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                          selected
                            ? option.color
                            : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        {option.icon}
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Payment details column */}
              <div className="space-y-3">
                {/* Cash: amount received + change */}
                {paymentMethod === "cash" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto recibido</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        disabled={processing}
                        autoFocus
                        className="text-lg h-11"
                      />
                    </div>

                    {amountReceived && Number.parseFloat(amountReceived) >= total && (
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-900 dark:text-green-100">Vuelto:</span>
                            <span className="font-bold text-green-900 dark:text-green-100 text-xl">
                              ${change.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Card/Transfer: no extra input needed, show confirmation */}
                {(paymentMethod === "card" || paymentMethod === "transfer") && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {paymentMethod === "card" ? (
                          <CreditCard className="h-8 w-8 text-blue-600" />
                        ) : (
                          <ArrowRightLeft className="h-8 w-8 text-violet-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {paymentMethod === "card"
                          ? "El cobro se realizará con tarjeta"
                          : "El cobro se realizará por transferencia"}
                      </p>
                      <p className="text-2xl font-bold mt-1">${total.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Mixed payment */}
                {paymentMethod === "mixed" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mixed-cash" className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-green-600" />
                        Monto en efectivo
                      </Label>
                      <Input
                        id="mixed-cash"
                        type="number"
                        step="0.01"
                        min="0"
                        max={total}
                        placeholder="0.00"
                        value={mixedCashAmount}
                        onChange={(e) => setMixedCashAmount(e.target.value)}
                        disabled={processing}
                        autoFocus
                        className="text-lg h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Segundo método</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={mixedSecondMethod === "card" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setMixedSecondMethod("card")}
                          disabled={processing}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                          Tarjeta
                        </Button>
                        <Button
                          type="button"
                          variant={mixedSecondMethod === "transfer" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setMixedSecondMethod("transfer")}
                          disabled={processing}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                          Transferencia
                        </Button>
                      </div>
                    </div>

                    {/* Split summary */}
                    {mixedCash > 0 && mixedCash < total && (
                      <>
                        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Banknote className="h-3.5 w-3.5 text-green-600" />
                                Efectivo
                              </span>
                              <span className="font-semibold">${mixedCash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                {mixedSecondMethod === "card" ? (
                                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                                ) : (
                                  <ArrowRightLeft className="h-3.5 w-3.5 text-violet-600" />
                                )}
                                {mixedSecondMethod === "card" ? "Tarjeta" : "Transferencia"}
                              </span>
                              <span className="font-semibold">${mixedSecondAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm font-bold">
                              <span>Total</span>
                              <span>${total.toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <Label htmlFor="mixed-received" className="text-sm">
                            Efectivo recibido del cliente
                          </Label>
                          <Input
                            id="mixed-received"
                            type="number"
                            step="0.01"
                            min={mixedCash}
                            placeholder={mixedCash.toFixed(2)}
                            value={mixedAmountReceived}
                            onChange={(e) => setMixedAmountReceived(e.target.value)}
                            disabled={processing}
                            className="h-11"
                          />
                        </div>
                      </>
                    )}

                    {mixedChange > 0 && (
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-900 dark:text-green-100 text-sm">Vuelto:</span>
                            <span className="font-bold text-green-900 dark:text-green-100 text-lg">
                              ${mixedChange.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {mixedCash > 0 && mixedCash >= total && (
                      <p className="text-xs text-amber-600">
                        El monto en efectivo debe ser menor al total. Usá el método "Efectivo" si el pago es completo.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
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
                size="lg"
                className="w-full sm:flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>Confirmar Pago - ${total.toFixed(2)}</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
