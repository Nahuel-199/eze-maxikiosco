"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ScanBarcode, AlertTriangle, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductList } from "@/components/product-list"
import { CategoryList } from "@/components/category-list"
import { ProductDialog } from "@/components/product-dialog"
import { CategoryDialog } from "@/components/category-dialog"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { getLowStockCount, getCategories } from "@/lib/actions/products"

export function ProductManagement() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("products")
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get("lowStock") === "true")
  const [lowStockCount, setLowStockCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([])

  // Cargar conteo de stock bajo y categorías
  useEffect(() => {
    getLowStockCount().then(setLowStockCount).catch(() => setLowStockCount(0))
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [refreshKey])

  // Función para manejar el escaneo de código de barras
  const handleBarcodeScan = useCallback((barcode: string) => {
    // Cambiar a la pestaña de productos y buscar por código de barras
    setActiveTab("products")
    setSearchTerm(barcode)
  }, [])

  // Hook del escáner de código de barras
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showProductDialog && !showCategoryDialog,
    minLength: 3,
    maxDelay: 50,
  })

  const handleEditProduct = (productId: string) => {
    setEditingProduct(productId)
    setShowProductDialog(true)
  }

  const handleEditCategory = (categoryId: string) => {
    setEditingCategory(categoryId)
    setShowCategoryDialog(true)
  }

  const handleCloseProductDialog = (open: boolean) => {
    setShowProductDialog(open)
    if (!open) {
      setEditingProduct(null)
    }
  }

  const handleCloseCategoryDialog = (open: boolean) => {
    setShowCategoryDialog(open)
    if (!open) {
      setEditingCategory(null)
    }
  }

  const handleProductSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleCategorySuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const toggleLowStockFilter = () => {
    setLowStockFilter((prev) => {
      const next = !prev
      // Limpiar query param de la URL
      if (!next && searchParams.get("lowStock")) {
        router.replace("/dashboard/products", { scroll: false })
      }
      return next
    })
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Gestión de Productos</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Administra tu inventario y categorías</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="products" className="flex-1 sm:flex-none">Productos</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 sm:flex-none">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Banner de alerta de stock bajo */}
          {lowStockCount > 0 && !lowStockFilter && (
            <button
              onClick={toggleLowStockFilter}
              className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors text-left dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {lowStockCount === 1
                    ? "1 producto con stock bajo"
                    : `${lowStockCount} productos con stock bajo`}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                  Hacé click para ver los productos que necesitan reposición
                </p>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 shrink-0">
                {lowStockCount}
              </Badge>
            </button>
          )}

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    {lowStockFilter ? "Productos con stock bajo" : "Productos"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {lowStockFilter
                      ? "Productos que necesitan reposición"
                      : "Gestiona todos los productos del inventario"}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {lowStockFilter ? (
                    <Button
                      variant="outline"
                      onClick={toggleLowStockFilter}
                      className="w-full sm:w-auto"
                    >
                      Ver todos
                    </Button>
                  ) : (
                    <Button onClick={() => setShowProductDialog(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!lowStockFilter && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto o escanear código de barras..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Todas las categorías" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ProductList
                searchTerm={lowStockFilter ? "" : searchTerm}
                onEdit={handleEditProduct}
                onRefresh={handleProductSuccess}
                refreshKey={refreshKey}
                lowStock={lowStockFilter}
                categoryId={selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Categorías</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Organiza tus productos por categorías</CardDescription>
                </div>
                <Button onClick={() => setShowCategoryDialog(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CategoryList
                onEdit={handleEditCategory}
                onRefresh={handleCategorySuccess}
                refreshKey={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={showProductDialog}
        onOpenChange={handleCloseProductDialog}
        productId={editingProduct}
        onSuccess={handleProductSuccess}
      />

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={handleCloseCategoryDialog}
        categoryId={editingCategory}
        onSuccess={handleCategorySuccess}
      />
    </div>
  )
}
