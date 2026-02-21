"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  Package,
  Loader2,
  AlertTriangle,
  Lock,
  ScanBarcode,
} from "lucide-react"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import Link from "next/link"
import type { CartItem, CashRegister } from "@/lib/types"
import { PaymentDialog } from "@/components/payment-dialog"
import { getAllProducts } from "@/lib/actions/products"
import { getCategoriesAll } from "@/lib/actions/categories"
import { getActiveCashRegister } from "@/lib/actions/cash-register"

interface POSSystemProps {
  user: {
    id: string
    full_name: string
  }
}

interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  category_id?: string
  price: number
  stock: number
  min_stock: number
  image_url?: string
  active: boolean
}

interface Category {
  id: string
  name: string
  icon?: string
  active: boolean
}

export function POSSystem({ user }: POSSystemProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado para feedback del escáner
  const [scanFeedback, setScanFeedback] = useState<{
    type: "success" | "error" | "warning"
    message: string
    productName?: string
  } | null>(null)
  const scanFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar productos, categorías y estado de caja al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [productsData, categoriesData, cashRegister] = await Promise.all([
          getAllProducts(),
          getCategoriesAll(),
          getActiveCashRegister(),
        ])
        setProducts(productsData || [])
        setCategories(categoriesData.filter((c) => c.active) || [])
        setActiveCashRegister(cashRegister)
      } catch (error) {
        console.error("Error al cargar datos del POS:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const reloadCashRegister = async () => {
    const cashRegister = await getActiveCashRegister()
    setActiveCashRegister(cashRegister)
  }

  // Función para mostrar feedback del escáner
  const showScanFeedback = useCallback(
    (type: "success" | "error" | "warning", message: string, productName?: string) => {
      // Limpiar timeout anterior si existe
      if (scanFeedbackTimeoutRef.current) {
        clearTimeout(scanFeedbackTimeoutRef.current)
      }

      setScanFeedback({ type, message, productName })

      // Ocultar después de 3 segundos
      scanFeedbackTimeoutRef.current = setTimeout(() => {
        setScanFeedback(null)
      }, 3000)
    },
    []
  )

  // Función para manejar el escaneo de código de barras
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      if (!activeCashRegister) {
        showScanFeedback("error", "Debe abrir la caja para escanear productos")
        return
      }

      // Buscar producto por código de barras
      const product = products.find(
        (p) => p.barcode?.toLowerCase() === barcode.toLowerCase() && p.active
      )

      if (!product) {
        showScanFeedback("error", `Producto no encontrado: ${barcode}`)
        // También actualizar el campo de búsqueda para que el usuario pueda ver qué se escaneó
        setSearchTerm(barcode)
        return
      }

      if (product.stock <= 0) {
        showScanFeedback("warning", "Sin stock disponible", product.name)
        return
      }

      // Verificar si ya está en el carrito
      const existingItem = cart.find((item) => item.product.id === product.id)

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showScanFeedback("warning", "Stock máximo alcanzado", product.name)
          return
        }
        // Incrementar cantidad
        setCart(
          cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        )
        showScanFeedback("success", `+1 unidad (${existingItem.quantity + 1} total)`, product.name)
      } else {
        // Agregar nuevo producto al carrito
        setCart([...cart, { product, quantity: 1 }])
        showScanFeedback("success", "Agregado al carrito", product.name)
      }

      // Limpiar búsqueda después de escanear exitosamente
      setSearchTerm("")
    },
    [activeCashRegister, products, cart, showScanFeedback]
  )

  // Hook del escáner de código de barras
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !!activeCashRegister && !showPayment && !loading,
    minLength: 3,
    maxDelay: 50,
  })

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (scanFeedbackTimeoutRef.current) {
        clearTimeout(scanFeedbackTimeoutRef.current)
      }
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search) ||
        product.barcode?.toLowerCase().includes(search)

      const matchesCategory = !selectedCategory || product.category_id === selectedCategory

      return matchesSearch && matchesCategory && product.active
    })
  }, [products, searchTerm, selectedCategory])

  const addToCart = (productId: string) => {
    if (!activeCashRegister) return

    const product = products.find((p) => p.id === productId)
    if (!product) return

    const existingItem = cart.find((item) => item.product.id === productId)

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity <= product.stock) {
      setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const handlePaymentComplete = async () => {
    setCart([])
    setShowPayment(false)
    // Recargar productos para actualizar stock
    const productsData = await getAllProducts()
    setProducts(productsData || [])
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando punto de venta...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar alerta si no hay caja abierta
  if (!activeCashRegister) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full w-fit mx-auto mb-4">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Caja No Disponible</h2>
            <p className="text-muted-foreground mb-6">
              Para realizar ventas, primero debes abrir una caja registradora.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard/cash-register">
                Ir a Control de Caja
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Cash Register Info Banner */}
      <Alert className="mb-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <AlertTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Caja abierta por {activeCashRegister.operator_name}
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300 text-xs flex items-center gap-2 flex-wrap">
          <span>Apertura: ${activeCashRegister.opening_amount.toFixed(2)} - {new Date(activeCashRegister.opened_at).toLocaleString("es-AR")}</span>
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <ScanBarcode className="h-3 w-3" />
            Escáner activo
          </span>
        </AlertDescription>
      </Alert>

      {/* Scan Feedback */}
      {scanFeedback && (
        <Alert
          className={`mb-4 transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            scanFeedback.type === "success"
              ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
              : scanFeedback.type === "warning"
              ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
          }`}
        >
          <ScanBarcode
            className={`h-4 w-4 ${
              scanFeedback.type === "success"
                ? "text-green-600"
                : scanFeedback.type === "warning"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          />
          <AlertTitle
            className={
              scanFeedback.type === "success"
                ? "text-green-800 dark:text-green-200"
                : scanFeedback.type === "warning"
                ? "text-yellow-800 dark:text-yellow-200"
                : "text-red-800 dark:text-red-200"
            }
          >
            {scanFeedback.productName || "Escaneo"}
          </AlertTitle>
          <AlertDescription
            className={
              scanFeedback.type === "success"
                ? "text-green-700 dark:text-green-300"
                : scanFeedback.type === "warning"
                ? "text-yellow-700 dark:text-yellow-300"
                : "text-red-700 dark:text-red-300"
            }
          >
            {scanFeedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Mobile Cart Summary - Fixed at bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-bold text-lg">${total.toFixed(2)}</p>
            </div>
          </div>
          <Button
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            className="flex-1 max-w-[200px]"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pagar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 pb-24 lg:pb-0">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Seleccionar Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto o escanear código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              </div>

              {/* Category Filters */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="shrink-0"
                  >
                    Todas
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="shrink-0"
                    >
                      {category.icon} {category.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              {/* Products Grid */}
              <ScrollArea className="h-[calc(100vh-420px)] sm:h-[calc(100vh-380px)] lg:h-[500px] pr-2 sm:pr-4">
                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg font-medium mb-2">No hay productos disponibles</p>
                    <p className="text-xs sm:text-sm">Agrega productos desde la sección de Gestión de Productos</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                      {filteredProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                          onClick={() => addToCart(product.id)}
                        >
                          <CardContent className="p-2 sm:p-4">
                            <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                              )}
                            </div>
                            <h3 className="font-medium text-xs sm:text-sm mb-1 line-clamp-2">{product.name}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <p className="text-sm sm:text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                              <Badge
                                variant={product.stock <= product.min_stock ? "destructive" : "secondary"}
                                className="text-[10px] sm:text-xs w-fit"
                              >
                                Stock: {product.stock}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {filteredProducts.length === 0 && products.length > 0 && (
                      <div className="text-center py-8 sm:py-12 text-muted-foreground">
                        <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm sm:text-base">No se encontraron productos con ese criterio</p>
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart Area - Desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>El carrito está vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <Card key={item.product.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm flex-1">{item.product.name}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 bg-transparent"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 bg-transparent"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Procesar Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        cart={cart}
        total={total}
        userId={user.id}
        cashRegisterId={activeCashRegister.id}
        onComplete={handlePaymentComplete}
      />
    </div>
  )
}
