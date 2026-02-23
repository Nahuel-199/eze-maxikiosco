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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser, updateUser, getUserById } from "@/lib/actions/users"
import { PERMISSION_GROUPS, type Permission } from "@/lib/permissions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string | null
  onSuccess?: () => void
}

export function UserDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: UserDialogProps) {
  const isEditing = !!userId

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [errors, setErrors] = useState<{ full_name?: string; email?: string; password?: string }>({})

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee" as "admin" | "employee",
    permissions: [] as string[],
    active: true,
  })

  useEffect(() => {
    if (open && userId) {
      setLoadingData(true)
      getUserById(userId)
        .then((user) => {
          if (user) {
            setFormData({
              full_name: user.full_name,
              email: user.email,
              password: "",
              role: user.role,
              permissions: user.permissions ?? [],
              active: user.active,
            })
          }
        })
        .catch((error) => {
          console.error("Error al cargar usuario:", error)
          toast.error("Error al cargar el usuario")
        })
        .finally(() => setLoadingData(false))
    } else if (open && !userId) {
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "employee",
        permissions: [],
        active: true,
      })
      setErrors({})
    }
  }, [userId, open])

  const validateForm = () => {
    const newErrors: { full_name?: string; email?: string; password?: string } = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = "El nombre es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Ingrese un email válido"
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const togglePermission = (permission: Permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleGroupPermissions = (groupPermissions: Permission[], checked: boolean) => {
    setFormData((prev) => {
      const withoutGroup = prev.permissions.filter(
        (p) => !groupPermissions.includes(p as Permission)
      )
      return {
        ...prev,
        permissions: checked ? [...withoutGroup, ...groupPermissions] : withoutGroup,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const userData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password || undefined,
        role: formData.role,
        permissions: formData.role === "employee" ? formData.permissions : [],
        active: formData.active,
      }

      let result
      if (isEditing && userId) {
        result = await updateUser(userId, userData)
      } else {
        result = await createUser(userData)
      }

      if (!result) {
        toast.error("Error de conexión. Por favor intenta de nuevo.")
        return
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Usuario actualizado correctamente"
            : "Usuario creado correctamente"
        )
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(result.error || "Error al guardar el usuario")
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error)
      toast.error("Error al guardar el usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del usuario"
              : "Completa la información del nuevo usuario"}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value })
                    if (errors.full_name) setErrors({ ...errors, full_name: undefined })
                  }}
                  className={errors.full_name ? "border-destructive" : ""}
                  placeholder="Ingrese el nombre completo"
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                  className={errors.email ? "border-destructive" : ""}
                  placeholder="usuario@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña {isEditing ? "(dejar vacío para no cambiar)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  className={errors.password ? "border-destructive" : ""}
                  placeholder={isEditing ? "••••••••" : "Mínimo 6 caracteres"}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "employee" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                />
                <Label htmlFor="active">Usuario activo</Label>
              </div>

              {/* Permisos - solo para empleados */}
              {formData.role === "employee" && (
                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <Label className="text-base">Permisos</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecciona los permisos adicionales para este empleado. POS y Caja básica siempre están disponibles.
                    </p>
                  </div>

                  {PERMISSION_GROUPS.map((group) => {
                    const groupKeys = group.permissions.map((p) => p.key)
                    const allChecked = groupKeys.every((k) => formData.permissions.includes(k))
                    const someChecked = groupKeys.some((k) => formData.permissions.includes(k))

                    return (
                      <div key={group.label} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.label}`}
                            checked={allChecked ? true : someChecked ? "indeterminate" : false}
                            onCheckedChange={(checked) =>
                              toggleGroupPermissions(groupKeys, !!checked)
                            }
                          />
                          <Label
                            htmlFor={`group-${group.label}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {group.label}
                          </Label>
                        </div>
                        <div className="ml-6 space-y-1.5">
                          {group.permissions.map((perm) => (
                            <div key={perm.key} className="flex items-start space-x-2">
                              <Checkbox
                                id={`perm-${perm.key}`}
                                checked={formData.permissions.includes(perm.key)}
                                onCheckedChange={() => togglePermission(perm.key)}
                              />
                              <div className="grid gap-0.5 leading-none">
                                <Label
                                  htmlFor={`perm-${perm.key}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {perm.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
