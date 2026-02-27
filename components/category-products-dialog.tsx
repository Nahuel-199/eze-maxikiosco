"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import type { Product } from "@/lib/types"

interface CategoryProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: { id: string; name: string; icon?: string } | null
  products: Product[]
}

export function CategoryProductsDialog({
  open,
  onOpenChange,
  category,
  products,
}: CategoryProductsDialogProps) {
  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{category.icon || "📦"}</span>
            {category.name}
          </DialogTitle>
          <DialogDescription>
            {products.length} {products.length === 1 ? "producto" : "productos"} en esta categoría
          </DialogDescription>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              No hay productos en esta categoría
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            {/* Desktop: tabla */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
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
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">
                        ${product.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.active ? "default" : "secondary"} className="text-xs">
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate mr-2">{product.name}</span>
                        <Badge variant={product.active ? "default" : "secondary"} className="text-xs shrink-0">
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                        <span>Precio: ${product.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
