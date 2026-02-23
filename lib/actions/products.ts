"use server"

import { Types } from "mongoose"
import { connectDB } from "@/lib/db"
import { Product, Category } from "@/lib/models"
import { deleteImage } from "./cloudinary"
import { revalidatePath } from "next/cache"
import { requireSession, requirePermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export interface ProductFormData {
  name: string
  description?: string
  sku?: string
  barcode?: string
  category_id?: string
  price: number
  cost?: number
  stock: number
  min_stock: number
  image_url?: string
  active: boolean
}

export type SortOption =
  | "newest"      // Más reciente primero (default)
  | "oldest"      // Más antiguo primero
  | "name_asc"    // Nombre A-Z
  | "name_desc"   // Nombre Z-A
  | "price_asc"   // Precio menor a mayor
  | "price_desc"  // Precio mayor a menor

export interface GetProductsOptions {
  page?: number
  limit?: number
  sort?: SortOption
  search?: string
  lowStock?: boolean
}

export interface GetProductsResult {
  products: any[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const SORT_CONFIG: Record<SortOption, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
}

/**
 * Obtiene productos con paginación y ordenamiento
 */
export async function getProducts(options: GetProductsOptions = {}): Promise<GetProductsResult> {
  try {
    const auth = await requireSession()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const {
      page = 1,
      limit = 20,
      sort = "newest",
      search = "",
      lowStock = false,
    } = options

    // Construir filtro de búsqueda
    const filter: any = { active: true }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i")
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { barcode: searchRegex },
        { sku: searchRegex },
      ]
    }

    if (lowStock) {
      filter.$expr = { $lte: ["$stock", "$min_stock"] }
    }

    // Obtener total para paginación
    const total = await Product.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    // Obtener productos con paginación y ordenamiento
    const sortConfig = SORT_CONFIG[sort] || SORT_CONFIG.newest
    const skip = (page - 1) * limit

    const products = await Product.find(filter)
      .populate("category_id")
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .lean()

    // Convertir _id y category_id a strings para serialización
    const serializedProducts = products.map((product) => ({
      ...product,
      id: product._id.toString(),
      _id: product._id.toString(),
      category_id: product.category_id
        ? (product.category_id as any)._id.toString()
        : undefined,
      category: product.category_id
        ? {
            id: (product.category_id as any)._id.toString(),
            name: (product.category_id as any).name,
            icon: (product.category_id as any).icon,
          }
        : undefined,
      created_at: product.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
    }))

    return {
      products: serializedProducts,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error("Error al obtener productos:", error)
    throw new Error("Error al obtener productos")
  }
}

/**
 * Obtiene todos los productos activos (sin paginación)
 * Útil para el POS y otros lugares que necesitan la lista completa
 */
export async function getAllProducts() {
  try {
    const auth = await requireSession()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const products = await Product.find({ active: true })
      .populate("category_id")
      .sort({ name: 1 })
      .lean()

    return products.map((product) => ({
      ...product,
      id: product._id.toString(),
      _id: product._id.toString(),
      category_id: product.category_id
        ? (product.category_id as any)._id.toString()
        : undefined,
      category: product.category_id
        ? {
            id: (product.category_id as any)._id.toString(),
            name: (product.category_id as any).name,
            icon: (product.category_id as any).icon,
          }
        : undefined,
      created_at: product.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error al obtener productos:", error)
    throw new Error("Error al obtener productos")
  }
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(id: string) {
  try {
    const auth = await requireSession()
    if (auth.error) throw new Error(auth.error)

    await connectDB()

    const product = await Product.findById(id).populate("category_id").lean()

    if (!product) {
      return null
    }

    return {
      ...product,
      id: product._id.toString(),
      _id: product._id.toString(),
      category_id: product.category_id
        ? (product.category_id as any)._id.toString()
        : undefined,
      category: product.category_id
        ? {
            id: (product.category_id as any)._id.toString(),
            name: (product.category_id as any).name,
            icon: (product.category_id as any).icon,
          }
        : undefined,
      created_at: product.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error al obtener producto:", error)
    throw new Error("Error al obtener producto")
  }
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(data: ProductFormData) {
  try {
    const auth = await requirePermission(PERMISSIONS.PRODUCTS_CREATE)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    // Validar que la categoría existe si se proporciona
    if (data.category_id) {
      const categoryExists = await Category.findById(data.category_id)
      if (!categoryExists) {
        return {
          success: false,
          error: "La categoría seleccionada no existe",
        }
      }
    }

    // Validar unicidad de SKU y barcode si se proporcionan
    if (data.sku) {
      const existingSku = await Product.findOne({ sku: data.sku })
      if (existingSku) {
        return {
          success: false,
          error: "Ya existe un producto con ese SKU",
        }
      }
    }

    if (data.barcode) {
      const existingBarcode = await Product.findOne({ barcode: data.barcode })
      if (existingBarcode) {
        return {
          success: false,
          error: "Ya existe un producto con ese código de barras",
        }
      }
    }

    const product = await Product.create({
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      barcode: data.barcode || undefined,
      category_id: data.category_id || undefined,
      price: data.price,
      cost: data.cost || undefined,
      stock: data.stock,
      min_stock: data.min_stock,
      image_url: data.image_url || undefined,
      active: data.active,
    })

    revalidatePath("/dashboard/products")

    return {
      success: true,
      product: {
        id: product._id.toString(),
        name: product.name,
      },
    }
  } catch (error: any) {
    console.error("Error al crear producto:", error)

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al crear producto",
    }
  }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: string, data: ProductFormData) {
  try {
    const auth = await requirePermission(PERMISSIONS.PRODUCTS_EDIT)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const product = await Product.findById(id)
    if (!product) {
      return {
        success: false,
        error: "Producto no encontrado",
      }
    }

    // Validar que la categoría existe si se proporciona
    if (data.category_id) {
      const categoryExists = await Category.findById(data.category_id)
      if (!categoryExists) {
        return {
          success: false,
          error: "La categoría seleccionada no existe",
        }
      }
    }

    // Validar unicidad de SKU si cambió
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await Product.findOne({
        sku: data.sku,
        _id: { $ne: id },
      })
      if (existingSku) {
        return {
          success: false,
          error: "Ya existe un producto con ese SKU",
        }
      }
    }

    // Validar unicidad de barcode si cambió
    if (data.barcode && data.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({
        barcode: data.barcode,
        _id: { $ne: id },
      })
      if (existingBarcode) {
        return {
          success: false,
          error: "Ya existe un producto con ese código de barras",
        }
      }
    }

    // Si la imagen cambió, eliminar la anterior
    if (data.image_url !== product.image_url && product.image_url) {
      await deleteImage(product.image_url)
    }

    // Actualizar producto
    product.name = data.name
    product.description = data.description || undefined
    product.sku = data.sku || undefined
    product.barcode = data.barcode || undefined
    product.category_id = data.category_id ? new Types.ObjectId(data.category_id) : undefined
    product.price = data.price
    product.cost = data.cost || undefined
    product.stock = data.stock
    product.min_stock = data.min_stock
    product.image_url = data.image_url || undefined
    product.active = data.active

    await product.save()

    revalidatePath("/dashboard/products")

    return {
      success: true,
      product: {
        id: product._id.toString(),
        name: product.name,
      },
    }
  } catch (error: any) {
    console.error("Error al actualizar producto:", error)

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al actualizar producto",
    }
  }
}

/**
 * Elimina un producto (soft delete)
 */
export async function deleteProduct(id: string) {
  try {
    const auth = await requirePermission(PERMISSIONS.PRODUCTS_DELETE)
    if (auth.error) return { success: false, error: auth.error }

    await connectDB()

    const product = await Product.findById(id)
    if (!product) {
      return {
        success: false,
        error: "Producto no encontrado",
      }
    }

    // Eliminar imagen de Cloudinary si existe
    if (product.image_url) {
      await deleteImage(product.image_url)
    }

    // Soft delete (marcar como inactivo)
    product.active = false
    await product.save()

    // Si prefieres eliminación física, usa:
    // await product.deleteOne()

    revalidatePath("/dashboard/products")

    return {
      success: true,
      message: "Producto eliminado correctamente",
    }
  } catch (error: any) {
    console.error("Error al eliminar producto:", error)
    return {
      success: false,
      error: error.message || "Error al eliminar producto",
    }
  }
}

/**
 * Obtiene la cantidad de productos con stock bajo
 */
export async function getLowStockCount(): Promise<number> {
  try {
    const auth = await requireSession()
    if (auth.error) return 0

    await connectDB()

    return await Product.countDocuments({
      active: true,
      $expr: { $lte: ["$stock", "$min_stock"] },
    })
  } catch (error) {
    console.error("Error al obtener conteo de stock bajo:", error)
    return 0
  }
}

/**
 * Obtiene todas las categorías para el selector
 */
export async function getCategories() {
  try {
    const auth = await requireSession()
    if (auth.error) return []

    await connectDB()

    const categories = await Category.find({ active: true })
      .sort({ name: 1 })
      .lean()

    return categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      icon: cat.icon,
    }))
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return []
  }
}
