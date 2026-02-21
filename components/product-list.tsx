"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, AlertCircle, Loader2, Package, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { getProducts, deleteProduct, type SortOption } from "@/lib/actions/products"

interface ProductListProps {
  searchTerm: string
  onEdit: (productId: string) => void
  onRefresh: () => void
  refreshKey?: number
}

interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  category_id?: string
  category?: {
    id: string
    name: string
    icon?: string
  }
  price: number
  stock: number
  min_stock: number
  image_url?: string
  active: boolean
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Más reciente" },
  { value: "oldest", label: "Más antiguo" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "name_desc", label: "Nombre Z-A" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
]

const ITEMS_PER_PAGE = 20

export function ProductList({ searchTerm, onEdit, onRefresh, refreshKey }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Paginación y ordenamiento
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  // Debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // Reset a página 1 cuando cambia la búsqueda
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getProducts({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sort: sortOption,
          search: debouncedSearch,
        })

        setProducts(result.products || [])
        setTotalPages(result.totalPages)
        setTotalProducts(result.total)
      } catch (error) {
        console.error("Error al cargar productos:", error)
        setError("Error al cargar productos. Por favor intenta nuevamente.")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [refreshKey, currentPage, sortOption, debouncedSearch])

  const getCategoryName = (product: Product) => {
    return product.category?.name || "Sin categoría"
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    setDeleting(true)
    try {
      const result = await deleteProduct(productToDelete.id)
      if (result.success) {
        onRefresh()
      } else {
        alert(result.error || "Error al eliminar el producto")
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      alert("Error al eliminar el producto")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleSortChange = (value: SortOption) => {
    setSortOption(value)
    setCurrentPage(1) // Reset a página 1 cuando cambia el ordenamiento
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Calcular rango de productos mostrados
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => onRefresh()}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Controles de ordenamiento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {totalProducts > 0 ? (
            <>
              Mostrando {startIndex}-{endIndex} de {totalProducts} productos
            </>
          ) : (
            "No hay productos"
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {debouncedSearch
              ? "No se encontraron productos con ese criterio de búsqueda."
              : "No hay productos registrados. Crea tu primer producto."}
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-3 sm:p-4 bg-card shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{getCategoryName(product)}</p>
                    </div>
                    <div className="flex gap-1 -mr-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={product.active ? "default" : "secondary"} className="text-xs">
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                    {product.stock <= product.min_stock && (
                      <Badge variant="destructive" className="text-xs">
                        Stock bajo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-0.5">Código</p>
                  <p className="font-medium text-xs sm:text-sm truncate">{product.barcode || "-"}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-0.5">Precio</p>
                  <p className="font-bold text-sm sm:text-base text-primary">${product.price.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-0.5">Stock</p>
                  <p className={`font-bold text-sm sm:text-base ${product.stock <= product.min_stock ? "text-destructive" : ""}`}>
                    {product.stock}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block border rounded-md overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Producto</TableHead>
              <TableHead className="hidden xl:table-cell">Código</TableHead>
              <TableHead className="hidden lg:table-cell">Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead className="text-right w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {debouncedSearch
                    ? "No se encontraron productos con ese criterio de búsqueda."
                    : "No hay productos registrados. Crea tu primer producto."}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground lg:hidden">{getCategoryName(product)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden xl:table-cell font-mono text-sm">
                    {product.barcode || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{getCategoryName(product)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.stock <= product.min_stock && <AlertCircle className="h-4 w-4 text-destructive" />}
                      <span className={product.stock <= product.min_stock ? "text-destructive font-semibold" : "font-medium"}>
                        {product.stock}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(product.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Números de página - solo en desktop */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            {/* Indicador móvil */}
            <div className="sm:hidden px-3 py-1 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar el producto "{productToDelete?.name}"?
              Esta acción marcará el producto como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
