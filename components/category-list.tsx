"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { getCategoriesAll, deleteCategory } from "@/lib/actions/categories"
import { getAllProducts } from "@/lib/actions/products"
import { CategoryProductsDialog } from "@/components/category-products-dialog"

interface CategoryListProps {
  onEdit: (categoryId: string) => void
  onRefresh: () => void
  refreshKey?: number
}

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  active: boolean
}

export function CategoryList({ onEdit, onRefresh, refreshKey }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([getCategoriesAll(), getAllProducts()])
      .then(([categoriesData, productsData]) => {
        setCategories(categoriesData || [])
        setProducts(productsData || [])
      })
      .catch((error) => {
        console.error("Error al cargar categorías:", error)
        setError("Error al cargar categorías. Por favor intenta nuevamente.")
        setCategories([])
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId && p.active).length
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    setDeleting(true)
    try {
      const result = await deleteCategory(categoryToDelete.id)
      if (result.success) {
        onRefresh()
      } else {
        alert(result.error || "Error al eliminar la categoría")
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error)
      alert("Error al eliminar la categoría")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

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
          onClick={() => setLoading(true)}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
        <p className="text-muted-foreground mb-4">
          No hay categorías registradas. Crea tu primera categoría.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">{category.icon || "📦"}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(category.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(category)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 gap-2">
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {getProductCount(category.id)} productos
              </Badge>
              <Badge variant={category.active ? "default" : "secondary"} className="text-xs">
                {category.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      <CategoryProductsDialog
        open={!!selectedCategory}
        onOpenChange={(open) => { if (!open) setSelectedCategory(null) }}
        category={selectedCategory}
        products={products.filter((p) => p.category_id === selectedCategory?.id)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar la categoría "{categoryToDelete?.name}"?
              {getProductCount(categoryToDelete?.id || "") > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta categoría tiene productos asociados y no puede ser eliminada.
                </span>
              )}
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
    </div>
  )
}
