"use server"

import { connectDB } from "@/lib/db"
import { Category } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { requireSession, requirePermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { createAuditLog } from "./audit-log"

export interface CategoryFormData {
  name: string
  description?: string
  icon?: string
  active: boolean
}

/**
 * Obtiene todas las categorías
 */
export async function getCategoriesAll() {
  try {
    const auth = await requireSession()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const categories = await Category.find({ active: true }).sort({ name: 1 }).lean()

    return categories.map((category) => ({
      ...category,
      id: category._id.toString(),
      _id: category._id.toString(),
      created_at: category.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: category.updatedAt?.toISOString() || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    throw new Error("Error al obtener categorías")
  }
}

/**
 * Obtiene una categoría por ID
 */
export async function getCategoryById(id: string) {
  try {
    const auth = await requireSession()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const category = await Category.findById(id).lean()

    if (!category) {
      return null
    }

    return {
      ...category,
      id: category._id.toString(),
      _id: category._id.toString(),
      created_at: category.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: category.updatedAt?.toISOString() || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error al obtener categoría:", error)
    throw new Error("Error al obtener categoría")
  }
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(data: CategoryFormData) {
  try {
    const auth = await requirePermission(PERMISSIONS.CATEGORIES_CREATE)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    // Validar unicidad del nombre
    const existingName = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    })
    if (existingName) {
      return {
        success: false,
        error: "Ya existe una categoría con ese nombre",
      }
    }

    const category = await Category.create({
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
      active: data.active,
    })

    await createAuditLog({
      user_id: auth.session.id,
      user_name: auth.session.full_name,
      user_email: auth.session.email,
      action: "create",
      entity_type: "category",
      entity_name: category.name,
      entity_id: category._id.toString(),
    })

    revalidatePath("/dashboard/products")

    return {
      success: true,
      category: {
        id: category._id.toString(),
        name: category.name,
      },
    }
  } catch (error: any) {
    console.error("Error al crear categoría:", error)

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al crear categoría",
    }
  }
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(id: string, data: CategoryFormData) {
  try {
    const auth = await requirePermission(PERMISSIONS.CATEGORIES_EDIT)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const category = await Category.findById(id)
    if (!category) {
      return {
        success: false,
        error: "Categoría no encontrada",
      }
    }

    // Validar unicidad del nombre si cambió
    if (data.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingName = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
        _id: { $ne: id },
      })
      if (existingName) {
        return {
          success: false,
          error: "Ya existe una categoría con ese nombre",
        }
      }
    }

    // Capturar valores anteriores para auditoría
    const oldValues = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      active: category.active,
    }

    // Actualizar categoría
    category.name = data.name
    category.description = data.description || undefined
    category.icon = data.icon || undefined
    category.active = data.active

    await category.save()

    // Registrar auditoría
    const fieldLabels: Record<string, string> = {
      name: "Nombre",
      description: "Descripción",
      icon: "Ícono",
      active: "Activo",
    }

    const newValues: Record<string, any> = {
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
      active: data.active,
    }

    const changes = Object.keys(fieldLabels)
      .filter((key) => {
        const oldVal = oldValues[key as keyof typeof oldValues]
        const newVal = newValues[key]
        return String(oldVal ?? "") !== String(newVal ?? "")
      })
      .map((key) => ({
        field: fieldLabels[key],
        from: oldValues[key as keyof typeof oldValues] ?? null,
        to: newValues[key] ?? null,
      }))

    if (changes.length > 0) {
      await createAuditLog({
        user_id: auth.session.id,
        user_name: auth.session.full_name,
        user_email: auth.session.email,
        action: "update",
        entity_type: "category",
        entity_name: data.name,
        entity_id: category._id.toString(),
        changes,
      })
    }

    revalidatePath("/dashboard/products")

    return {
      success: true,
      category: {
        id: category._id.toString(),
        name: category.name,
      },
    }
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error)

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al actualizar categoría",
    }
  }
}

/**
 * Elimina una categoría (soft delete)
 */
export async function deleteCategory(id: string) {
  try {
    const auth = await requirePermission(PERMISSIONS.CATEGORIES_DELETE)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const category = await Category.findById(id)
    if (!category) {
      return {
        success: false,
        error: "Categoría no encontrada",
      }
    }

    // Verificar si hay productos usando esta categoría
    const Product = (await import("@/lib/models")).Product
    const productsCount = await Product.countDocuments({
      category_id: id,
      active: true,
    })

    if (productsCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar. Hay ${productsCount} producto(s) usando esta categoría.`,
      }
    }

    // Soft delete (marcar como inactivo)
    category.active = false
    await category.save()

    await createAuditLog({
      user_id: auth.session.id,
      user_name: auth.session.full_name,
      user_email: auth.session.email,
      action: "delete",
      entity_type: "category",
      entity_name: category.name,
      entity_id: category._id.toString(),
    })

    revalidatePath("/dashboard/products")

    return {
      success: true,
      message: "Categoría eliminada correctamente",
    }
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error)
    return {
      success: false,
      error: error.message || "Error al eliminar categoría",
    }
  }
}
