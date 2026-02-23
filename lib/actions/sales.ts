"use server"

import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { Sale, Product, CashRegister } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { getSession, requireSession } from "@/lib/auth"
import type { Sale as SaleType, SaleItem } from "@/lib/types"

/**
 * Valida si un string es un ObjectId válido de MongoDB
 */
function isValidObjectId(id: string | undefined): boolean {
  if (!id) return false
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

export interface SaleItemData {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CreateSaleData {
  items: SaleItemData[]
  total: number
  payment_method: "cash" | "card" | "transfer"
}

/**
 * Crea una nueva venta y actualiza el stock de productos
 * Usa transacción de MongoDB para garantizar consistencia
 */
export async function createSale(data: CreateSaleData) {
  const auth = await requireSession()
  if (auth.error) return { success: false, error: auth.error }

  await connectDB()

  const dbSession = await mongoose.startSession()
  dbSession.startTransaction()

  try {
    const session = await getSession()
    const userId = session?.id
    const validUserId = isValidObjectId(userId) ? userId : undefined
    const placeholderUserId = new mongoose.Types.ObjectId("000000000000000000000000")

    // Verificar que hay una caja abierta
    const cashRegister = await CashRegister.findOne({ status: "open" }).session(
      dbSession
    )
    if (!cashRegister) {
      throw new Error(
        "No hay una caja abierta. Debe abrir una caja antes de realizar ventas."
      )
    }

    // Verificar stock disponible para todos los productos
    for (const item of data.items) {
      const product = await Product.findById(item.product_id).session(dbSession)
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.product_name}`)
      }
      if (!product.active) {
        throw new Error(`El producto "${item.product_name}" no está disponible`)
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${item.product_name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        )
      }
    }

    // Crear la venta
    const saleItems = data.items.map((item) => ({
      product_id: new mongoose.Types.ObjectId(item.product_id),
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }))

    const [sale] = await Sale.create(
      [
        {
          cash_register_id: cashRegister._id,
          user_id: validUserId ? new mongoose.Types.ObjectId(validUserId) : placeholderUserId,
          total: data.total,
          payment_method: data.payment_method,
          items: saleItems,
        },
      ],
      { session: dbSession }
    )

    // Actualizar stock de cada producto
    for (const item of data.items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { stock: -item.quantity } },
        { session: dbSession }
      )
    }

    await dbSession.commitTransaction()

    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard/cash-register")

    return {
      success: true,
      sale: {
        id: sale._id.toString(),
        total: sale.total,
        payment_method: sale.payment_method,
      },
    }
  } catch (error: any) {
    await dbSession.abortTransaction()
    console.error("Error al crear venta:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al procesar la venta",
    }
  } finally {
    dbSession.endSession()
  }
}

/**
 * Obtiene las ventas de una caja específica
 */
export async function getSalesByCashRegister(cashRegisterId: string): Promise<SaleType[]> {
  try {
    const auth = await requireSession()
    if (auth.error) return []

    await connectDB()

    const sales = await Sale.find({ cash_register_id: cashRegisterId })
      .sort({ createdAt: -1 })
      .lean()

    return sales.map((sale) => ({
      id: sale._id.toString(),
      cash_register_id: sale.cash_register_id.toString(),
      user_id: sale.user_id.toString(),
      total: sale.total,
      payment_method: sale.payment_method,
      created_at: sale.createdAt.toISOString(),
      items: sale.items.map((item) => ({
        id: item._id?.toString() || "",
        sale_id: sale._id.toString(),
        product_id: item.product_id.toString(),
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        created_at: sale.createdAt.toISOString(),
      })),
    }))
  } catch (error) {
    console.error("Error al obtener ventas:", error)
    return []
  }
}

/**
 * Obtiene las ventas de la caja activa
 */
export async function getActiveRegisterSales(): Promise<SaleType[]> {
  try {
    const auth = await requireSession()
    if (auth.error) return []

    await connectDB()

    const cashRegister = await CashRegister.findOne({ status: "open" })
    if (!cashRegister) {
      return []
    }

    return getSalesByCashRegister(cashRegister._id.toString())
  } catch (error) {
    console.error("Error al obtener ventas de caja activa:", error)
    return []
  }
}

/**
 * Obtiene los productos vendidos agrupados de una caja
 */
export async function getProductsSoldByRegister(
  cashRegisterId: string
): Promise<{ name: string; quantity: number; total: number }[]> {
  try {
    const auth = await requireSession()
    if (auth.error) return []

    await connectDB()

    const sales = await Sale.find({ cash_register_id: cashRegisterId }).lean()

    const productsSold: Record<string, { name: string; quantity: number; total: number }> = {}

    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.product_id.toString()
        if (!productsSold[key]) {
          productsSold[key] = { name: item.product_name, quantity: 0, total: 0 }
        }
        productsSold[key].quantity += item.quantity
        productsSold[key].total += item.subtotal
      }
    }

    return Object.values(productsSold).sort((a, b) => b.total - a.total)
  } catch (error) {
    console.error("Error al obtener productos vendidos:", error)
    return []
  }
}

/**
 * Obtiene estadísticas rápidas de la caja activa
 */
export async function getActiveRegisterStats() {
  try {
    const auth = await requireSession()
    if (auth.error) return null

    await connectDB()

    const cashRegister = await CashRegister.findOne({ status: "open" })
    if (!cashRegister) {
      return null
    }

    const sales = await Sale.find({ cash_register_id: cashRegister._id }).lean()

    let cashTotal = 0
    let cardTotal = 0
    let transferTotal = 0

    for (const sale of sales) {
      switch (sale.payment_method) {
        case "cash":
          cashTotal += sale.total
          break
        case "card":
          cardTotal += sale.total
          break
        case "transfer":
          transferTotal += sale.total
          break
      }
    }

    return {
      salesCount: sales.length,
      cashTotal: Number(cashTotal.toFixed(2)),
      cardTotal: Number(cardTotal.toFixed(2)),
      transferTotal: Number(transferTotal.toFixed(2)),
      total: Number((cashTotal + cardTotal + transferTotal).toFixed(2)),
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return null
  }
}
