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
import { Card, CardContent } from "@/components/ui/card"
import { Unlock, Loader2 } from "lucide-react"
import { openCashRegister } from "@/lib/actions/cash-register"
import { useToast } from "@/hooks/use-toast"

interface OpenRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultOperatorName?: string
}

export function OpenRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultOperatorName = ""
}: OpenRegisterDialogProps) {
  const [operatorName, setOperatorName] = useState(defaultOperatorName)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString("es-AR"))
  }, [])

  useEffect(() => {
    if (defaultOperatorName) {
      setOperatorName(defaultOperatorName)
    }
  }, [defaultOperatorName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const openingAmount = Number.parseFloat(amount)
    if (openingAmount < 0 || operatorName.trim().length < 2) {
      return
    }

    setIsLoading(true)

    try {
      const result = await openCashRegister({
        operator_name: operatorName.trim(),
        opening_amount: openingAmount,
      })

      if (result.success) {
        toast({
          title: "Caja abierta",
          description: `Caja abierta por ${operatorName} con $${openingAmount.toFixed(2)}`,
        })
        setAmount("")
        setOperatorName(defaultOperatorName)
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo abrir la caja",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al abrir la caja",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = operatorName.trim().length >= 2 && amount && Number.parseFloat(amount) >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Unlock className="h-5 w-5" />
            Abrir Caja
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Ingresa tu nombre y el monto inicial para abrir la caja
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <Card className="bg-muted/50">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Fecha y Hora</p>
                <p className="font-semibold text-sm sm:text-base">{currentDate}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="operator-name" className="text-sm sm:text-base">
                Nombre del Operador *
              </Label>
              <Input
                id="operator-name"
                type="text"
                placeholder="Tu nombre"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoFocus={!defaultOperatorName}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el nombre de quien operará la caja
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening-amount" className="text-sm sm:text-base">
                Monto de Apertura *
              </Label>
              <Input
                id="opening-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus={!!defaultOperatorName}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el efectivo inicial que tendrás disponible en la caja
              </p>
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
                  Abriendo...
                </>
              ) : (
                "Abrir Caja"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
