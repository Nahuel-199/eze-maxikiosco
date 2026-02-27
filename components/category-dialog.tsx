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
import { Switch } from "@/components/ui/switch"
import {
  createCategory,
  updateCategory,
  getCategoryById,
} from "@/lib/actions/categories"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId?: string | null
  onSuccess?: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryId,
  onSuccess,
}: CategoryDialogProps) {
  const isEditing = !!categoryId

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    active: true,
  })

  // Cargar categoría si estamos editando
  useEffect(() => {
    if (open && categoryId) {
      setLoadingData(true)
      getCategoryById(categoryId)
        .then((category) => {
          if (category) {
            setFormData({
              name: category.name,
              description: category.description || "",
              icon: category.icon || "",
              active: category.active,
            })
          }
        })
        .catch((error) => {
          console.error("Error al cargar categoría:", error)
          toast.error("Error al cargar la categoría")
        })
        .finally(() => setLoadingData(false))
    } else if (open && !categoryId) {
      // Resetear formulario para nueva categoría
      setFormData({
        name: "",
        description: "",
        icon: "",
        active: true,
      })
    }
  }, [categoryId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        active: formData.active,
      }

      let result
      if (isEditing && categoryId) {
        result = await updateCategory(categoryId, categoryData)
      } else {
        result = await createCategory(categoryData)
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente"
        )
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(result.error || "Error al guardar la categoría")
      }
    } catch (error) {
      console.error("Error al guardar categoría:", error)
      toast.error("Error al guardar la categoría")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEditing
              ? "Modifica los datos de la categoría"
              : "Completa la información de la nueva categoría"}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-sm sm:text-base">Nombre *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description" className="text-sm sm:text-base">Descripción</Label>
              <Textarea
                id="cat-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-icon" className="text-sm sm:text-base">Icono (emoji)</Label>
              <Input
                id="cat-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📦"
                maxLength={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="cat-active"
                checked={formData.active}
                onCheckedChange={(v) => setFormData({ ...formData, active: v })}
              />
              <Label htmlFor="cat-active" className="text-sm sm:text-base">Categoría activa</Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 shrink-0 pt-4 border-t">
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
                "Crear Categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
