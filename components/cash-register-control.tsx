"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Lock,
  Unlock,
  Loader2,
  ArrowDownCircle,
  CreditCard,
  Banknote,
  RefreshCw,
} from "lucide-react"
import { OpenRegisterDialog } from "@/components/open-register-dialog"
import { CloseRegisterDialog } from "@/components/close-register-dialog"
import { CashMovementDialog } from "@/components/cash-movement-dialog"
import { CashMovementsList } from "@/components/cash-movements-list"
import { CashRegisterHistory } from "@/components/cash-register-history"
import { getActiveCashRegister, getCashRegisterSummary } from "@/lib/actions/cash-register"
import { getActiveRegisterMovements } from "@/lib/actions/cash-movements"
import type { CashRegister, CashMovement, CashRegisterSummary } from "@/lib/types"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

interface CashRegisterControlProps {
  user: {
    id: string
    full_name: string
    role: string
    permissions?: string[]
  }
}

export function CashRegisterControl({ user }: CashRegisterControlProps) {
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null)
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showMovementDialog, setShowMovementDialog] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const register = await getActiveCashRegister()
      setActiveRegister(register)

      if (register) {
        const [summaryData, movementsData] = await Promise.all([
          getCashRegisterSummary(register.id),
          getActiveRegisterMovements(),
        ])
        setSummary(summaryData)
        setMovements(movementsData)
      } else {
        setSummary(null)
        setMovements([])
      }
    } catch (error) {
      console.error("Error loading cash register data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSuccess = () => {
    loadData()
  }

  const canDeleteMovements = hasPermission(user, PERMISSIONS.CASH_MOVEMENTS_DELETE)

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Control de Caja</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona la apertura y cierre de la caja registradora
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 mb-6">
        {/* Current Status Card */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Estado Actual</CardTitle>
            <CardDescription>Información de la caja registradora</CardDescription>
          </CardHeader>
          <CardContent>
            {activeRegister ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full shrink-0">
                      <Unlock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Caja Abierta</p>
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                        Abierta el {new Date(activeRegister.opened_at).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 w-fit">Activa</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monto de Apertura</p>
                      <p className="text-lg sm:text-2xl font-bold text-primary">
                        ${activeRegister.opening_amount.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Operador</p>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {activeRegister.operator_name}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowMovementDialog(true)}
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Registrar Egreso
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Cerrar Caja
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted-foreground/10 rounded-full shrink-0">
                      <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Caja Cerrada</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No hay una caja activa en este momento
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">Inactiva</Badge>
                </div>

                <Button className="w-full" size="lg" onClick={() => setShowOpenDialog(true)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats - Only shown when register is open */}
        {activeRegister && summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Ventas</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold">${summary.totalSales.toFixed(2)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {summary.salesCount} transacciones
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Efectivo</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  ${summary.salesCash.toFixed(2)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">En caja</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Tarjeta/Trans.</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  ${(summary.salesCard + summary.salesTransfer).toFixed(2)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Otros medios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Egresos</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  -${summary.totalMovements.toFixed(2)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {summary.movementsCount} movimientos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expected Amount Card */}
        {activeRegister && summary && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monto Esperado en Caja</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    ${summary.expectedAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    = Apertura (${summary.cashRegister.opening_amount.toFixed(2)}) + Efectivo ($
                    {summary.salesCash.toFixed(2)}) - Egresos (${summary.totalMovements.toFixed(2)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movements List */}
        {activeRegister && (
          <CashMovementsList
            movements={movements}
            isAdmin={canDeleteMovements}
            onMovementDeleted={handleSuccess}
          />
        )}
      </div>

      {/* History Section */}
      <CashRegisterHistory userId={user.id} userRole={user.role} />

      {/* Dialogs */}
      <OpenRegisterDialog
        open={showOpenDialog}
        onOpenChange={setShowOpenDialog}
        onSuccess={handleSuccess}
        defaultOperatorName={user.full_name}
      />

      <CloseRegisterDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        cashRegisterId={activeRegister?.id || null}
        onSuccess={handleSuccess}
      />

      <CashMovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        onSuccess={handleSuccess}
        operatorName={activeRegister?.operator_name || user.full_name}
      />
    </div>
  )
}
