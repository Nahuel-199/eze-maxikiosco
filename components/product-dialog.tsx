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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/image-upload"
import {
  createProduct,
  updateProduct,
  getProductById,
  getCategories,
} from "@/lib/actions/products"
import { toast } from "sonner"
import { Loader2, ScanBarcode } from "lucide-react"
import { BarcodeScanner } from "@/components/barcode-scanner"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string | null
  onSuccess?: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  productId,
  onSuccess,
}: ProductDialogProps) {
  const isEditing = !!productId

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; icon?: string }>
  >([])

  const [scannerOpen, setScannerOpen] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    category_id: "",
    price: "",
    cost: "",
    stock: "",
    image_url: "",
    active: true,
  })

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
    }
  }, [open])

  useEffect(() => {
    if (open && productId) {
      setLoadingData(true)
      getProductById(productId)
        .then((product) => {
          if (product) {
            setFormData({
              name: product.name,
              description: product.description || "",
              barcode: product.barcode || "",
              category_id: product.category_id || "",
              price: product.price.toString(),
              cost: product.cost?.toString() || "",
              stock: product.stock.toString(),
              image_url: product.image_url || "",
              active: product.active,
            })
          }
        })
        .catch((error) => {
          console.error("Error al cargar producto:", error)
          toast.error("Error al cargar el producto")
        })
        .finally(() => setLoadingData(false))
    } else if (open && !productId) {
      // Resetear formulario para nuevo producto
      setFormData({
        name: "",
        description: "",
        barcode: "",
        category_id: "",
        price: "",
        cost: "",
        stock: "",
        image_url: "",
        active: true,
      })
      setErrors({})
    }
  }, [productId, open])

  const validateForm = () => {
    const newErrors: { name?: string; price?: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = "El precio debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description || undefined,
        barcode: formData.barcode || undefined,
        category_id: formData.category_id || undefined,
        price: Number(formData.price),
        cost: formData.cost ? Number(formData.cost) : undefined,
        stock: formData.stock ? Number(formData.stock) : 0,
        min_stock: 0,
        image_url: formData.image_url || undefined,
        active: formData.active,
      }

      let result
      if (isEditing && productId) {
        result = await updateProduct(productId, productData)
      } else {
        result = await createProduct(productData)
      }

      if (!result) {
        toast.error("Error de conexión. Por favor intenta de nuevo.")
        return
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Producto actualizado correctamente"
            : "Producto creado correctamente"
        )
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(result.error || "Error al guardar el producto")
      }
    } catch (error) {
      console.error("Error al guardar producto:", error)
      toast.error("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del producto"
              : "Completa la información del nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  className={errors.name ? "border-destructive" : ""}
                  placeholder="Ingrese el nombre del producto"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                onRemove={() => setFormData({ ...formData, image_url: "" })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Escanear o ingresar manualmente"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear código de barras"
                >
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value })
                    if (errors.price) setErrors({ ...errors, price: undefined })
                  }}
                  className={errors.price ? "border-destructive" : ""}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Si no se especifica, el stock será 0</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(v) => setFormData({ ...formData, active: v })}
              />
              <Label htmlFor="active">Producto activo</Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Producto"
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(barcode) => {
          setFormData({ ...formData, barcode })
          toast.success("Código escaneado correctamente")
        }}
      />
    </Dialog>
  )
}
