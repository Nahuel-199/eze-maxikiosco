"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowDownCircle, Truck, Receipt, Settings, Wallet } from "lucide-react"
import { createCashMovement } from "@/lib/actions/cash-movements"
import { useToast } from "@/hooks/use-toast"
import type { CashMovementType } from "@/lib/types"

interface CashMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  operatorName: string
}

const MOVEMENT_TYPES: { value: CashMovementType; label: string; icon: React.ReactNode }[] = [
  { value: "supplier_payment", label: "Pago a Proveedor", icon: <Truck className="h-4 w-4" /> },
  { value: "expense", label: "Gasto", icon: <Receipt className="h-4 w-4" /> },
  { value: "adjustment", label: "Ajuste", icon: <Settings className="h-4 w-4" /> },
  { value: "withdrawal", label: "Retiro", icon: <Wallet className="h-4 w-4" /> },
]

export function CashMovementDialog({
  open,
  onOpenChange,
  onSuccess,
  operatorName
}: CashMovementDialogProps) {
  const [type, setType] = useState<CashMovementType>("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setType("expense")
    setAmount("")
    setDescription("")
    setSupplierName("")
    setReferenceNumber("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountValue = Number.parseFloat(amount)
    if (amountValue <= 0 || description.trim().length < 3) {
      return
    }

    if (type === "supplier_payment" && !supplierName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del proveedor es requerido para pagos a proveedores",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await createCashMovement({
        type,
        amount: amountValue,
        description: description.trim(),
        supplier_name: type === "supplier_payment" ? supplierName.trim() : undefined,
        reference_number: referenceNumber.trim() || undefined,
        created_by_name: operatorName,
      })

      if (result.success) {
        toast({
          title: "Movimiento registrado",
          description: `Egreso de $${amountValue.toFixed(2)} registrado correctamente`,
        })
        resetForm()
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo registrar el movimiento",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al registrar el movimiento",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isValid =
    amount &&
    Number.parseFloat(amount) > 0 &&
    description.trim().length >= 3 &&
    (type !== "supplier_payment" || supplierName.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
            Registrar Egreso
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Registra pagos a proveedores, gastos u otros egresos de caja
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="space-y-2">
              <Label htmlFor="movement-type" className="text-sm sm:text-base">
                Tipo de Movimiento *
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as CashMovementType)}>
                <SelectTrigger id="movement-type" disabled={isLoading}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        {t.icon}
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-amount" className="text-sm sm:text-base">
                Monto *
              </Label>
              <Input
                id="movement-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-description" className="text-sm sm:text-base">
                Descripcion *
              </Label>
              <Textarea
                id="movement-description"
                placeholder="Describe el motivo del egreso..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={2}
                className="resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Minimo 3 caracteres
              </p>
            </div>

            {type === "supplier_payment" && (
              <div className="space-y-2">
                <Label htmlFor="supplier-name" className="text-sm sm:text-base">
                  Nombre del Proveedor *
                </Label>
                <Input
                  id="supplier-name"
                  type="text"
                  placeholder="Nombre del proveedor"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                  maxLength={200}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reference-number" className="text-sm sm:text-base">
                N° de Referencia / Factura (opcional)
              </Label>
              <Input
                id="reference-number"
                type="text"
                placeholder="Ej: FAC-001234"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                maxLength={100}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 shrink-0 pt-4 border-t">
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
              disabled={!isValid || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Egreso"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
