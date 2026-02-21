"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ScanBarcode } from "lucide-react"
import { ProductList } from "@/components/product-list"
import { CategoryList } from "@/components/category-list"
import { ProductDialog } from "@/components/product-dialog"
import { CategoryDialog } from "@/components/category-dialog"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("products")

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
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Productos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Gestiona todos los productos del inventario</CardDescription>
                </div>
                <Button onClick={() => setShowProductDialog(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto o escanear código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              </div>
              <ProductList
                searchTerm={searchTerm}
                onEdit={handleEditProduct}
                onRefresh={handleProductSuccess}
                refreshKey={refreshKey}
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
