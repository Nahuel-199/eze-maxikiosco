"use server"

import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { requireAdmin } from "@/lib/auth"

export interface UserFormData {
  full_name: string
  email: string
  password?: string
  role: "admin" | "employee"
  permissions?: string[]
  active: boolean
}

export interface GetUsersOptions {
  page?: number
  limit?: number
  search?: string
}

export interface GetUsersResult {
  users: any[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const ITEMS_PER_PAGE = 20

/**
 * Obtiene usuarios con paginación y búsqueda
 */
export async function getUsers(options: GetUsersOptions = {}): Promise<GetUsersResult> {
  try {
    const auth = await requireAdmin()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const {
      page = 1,
      limit = ITEMS_PER_PAGE,
      search = "",
    } = options

    const filter: any = {}

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i")
      filter.$or = [
        { full_name: searchRegex },
        { email: searchRegex },
      ]
    }

    const total = await User.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const serializedUsers = users.map((user) => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
      active: user.active,
      last_login: user.last_login?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    }))

    return {
      users: serializedUsers,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    throw new Error("Error al obtener usuarios")
  }
}

/**
 * Obtiene un usuario por ID
 */
export async function getUserById(id: string) {
  try {
    const auth = await requireAdmin()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const user = await User.findById(id).lean()

    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
      active: user.active,
      last_login: user.last_login?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    throw new Error("Error al obtener usuario")
  }
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(data: UserFormData) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    if (!data.password) {
      return {
        success: false,
        error: "La contraseña es requerida",
      }
    }

    // Verificar email único
    const existingUser = await User.findOne({ email: data.email.toLowerCase() })
    if (existingUser) {
      return {
        success: false,
        error: "Ya existe un usuario con ese email",
      }
    }

    const password_hash = await bcrypt.hash(data.password, 10)

    const user = await User.create({
      full_name: data.full_name,
      email: data.email,
      password_hash,
      role: data.role,
      permissions: data.role === "admin" ? [] : (data.permissions ?? []),
      active: data.active,
    })

    revalidatePath("/dashboard/usuarios")

    return {
      success: true,
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
      },
    }
  } catch (error: any) {
    console.error("Error al crear usuario:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    if (error.code === 11000) {
      return { success: false, error: "Ya existe un usuario con ese email" }
    }

    return {
      success: false,
      error: error.message || "Error al crear usuario",
    }
  }
}

/**
 * Actualiza un usuario existente
 */
export async function updateUser(id: string, data: UserFormData) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return {
        success: false,
        error: "Usuario no encontrado",
      }
    }

    // Verificar email único si cambió
    if (data.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: id },
      })
      if (existingUser) {
        return {
          success: false,
          error: "Ya existe un usuario con ese email",
        }
      }
    }

    user.full_name = data.full_name
    user.email = data.email
    user.role = data.role
    user.permissions = data.role === "admin" ? [] : (data.permissions ?? [])
    user.active = data.active

    // Solo actualizar password si se proporcionó
    if (data.password) {
      user.password_hash = await bcrypt.hash(data.password, 10)
    }

    await user.save()

    revalidatePath("/dashboard/usuarios")

    return {
      success: true,
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
      },
    }
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    if (error.code === 11000) {
      return { success: false, error: "Ya existe un usuario con ese email" }
    }

    return {
      success: false,
      error: error.message || "Error al actualizar usuario",
    }
  }
}

/**
 * Elimina un usuario (soft delete)
 */
export async function deleteUser(id: string) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return {
        success: false,
        error: "Usuario no encontrado",
      }
    }

    user.active = false
    await user.save()

    revalidatePath("/dashboard/usuarios")

    return {
      success: true,
      message: "Usuario eliminado correctamente",
    }
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return {
      success: false,
      error: error.message || "Error al eliminar usuario",
    }
  }
}
