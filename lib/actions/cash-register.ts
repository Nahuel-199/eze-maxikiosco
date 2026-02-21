"use server"

import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { CashRegister, Sale, CashMovement } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import type { CashRegister as CashRegisterType, CashRegisterSummary } from "@/lib/types"

/**
 * Valida si un string es un ObjectId válido de MongoDB
 */
function isValidObjectId(id: string | undefined): boolean {
  if (!id) return false
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

export interface OpenCashRegisterData {
  operator_name: string
  opening_amount: number
}

export interface CloseCashRegisterData {
  closing_amount: number
  notes?: string
}

export interface CashRegisterHistoryFilters {
  operator_name?: string
  start_date?: string
  end_date?: string
  status?: "open" | "closed" | "all"
  page?: number
  limit?: number
}

/**
 * Abre una nueva caja registradora
 */
export async function openCashRegister(data: OpenCashRegisterData) {
  try {
    await connectDB()

    const session = await getSession()
    const userId = session?.id

    // Solo usar userId si es un ObjectId válido de MongoDB
    const validUserId = isValidObjectId(userId) ? userId : undefined
    // Usar un ObjectId placeholder válido si no hay usuario
    const placeholderUserId = "000000000000000000000000"

    const cashRegister = await CashRegister.create({
      operator_name: data.operator_name,
      opening_amount: data.opening_amount,
      opened_by_user_id: validUserId,
      user_id: validUserId || placeholderUserId,
      opened_at: new Date(),
      status: "open",
    })

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard/pos")

    return {
      success: true,
      cashRegister: {
        id: cashRegister._id.toString(),
        operator_name: cashRegister.operator_name,
        opening_amount: cashRegister.opening_amount,
      },
    }
  } catch (error: any) {
    console.error("Error al abrir caja:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al abrir caja",
    }
  }
}

/**
 * Obtiene la caja activa (si existe)
 */
export async function getActiveCashRegister(): Promise<CashRegisterType | null> {
  try {
    await connectDB()

    const cashRegister = await CashRegister.findOne({ status: "open" })
      .populate("opened_by_user_id")
      .lean()

    if (!cashRegister) {
      return null
    }

    return {
      id: cashRegister._id.toString(),
      operator_name: cashRegister.operator_name,
      opened_by_user_id: cashRegister.opened_by_user_id?.toString(),
      user_id: cashRegister.user_id.toString(),
      opening_amount: cashRegister.opening_amount,
      closing_amount: cashRegister.closing_amount,
      expected_amount: cashRegister.expected_amount,
      difference: cashRegister.difference,
      opened_at: cashRegister.opened_at.toISOString(),
      closed_at: cashRegister.closed_at?.toISOString(),
      status: cashRegister.status,
      notes: cashRegister.notes,
    }
  } catch (error) {
    console.error("Error al obtener caja activa:", error)
    return null
  }
}

/**
 * Obtiene el resumen de una caja registradora
 */
export async function getCashRegisterSummary(
  cashRegisterId: string
): Promise<CashRegisterSummary | null> {
  try {
    await connectDB()

    const cashRegister = await CashRegister.findById(cashRegisterId).lean()
    if (!cashRegister) {
      return null
    }

    // Obtener ventas de la caja
    const sales = await Sale.find({ cash_register_id: cashRegisterId }).lean()

    // Calcular totales por método de pago
    let salesCash = 0
    let salesCard = 0
    let salesTransfer = 0

    for (const sale of sales) {
      switch (sale.payment_method) {
        case "cash":
          salesCash += sale.total
          break
        case "card":
          salesCard += sale.total
          break
        case "transfer":
          salesTransfer += sale.total
          break
      }
    }

    // Obtener movimientos (egresos)
    const movements = await CashMovement.find({
      cash_register_id: cashRegisterId,
    }).lean()

    const totalMovements = movements.reduce((sum, mov) => sum + mov.amount, 0)

    // Calcular monto esperado: apertura + ventas efectivo - egresos
    const expectedAmount = Number(
      (cashRegister.opening_amount + salesCash - totalMovements).toFixed(2)
    )

    return {
      cashRegister: {
        id: cashRegister._id.toString(),
        operator_name: cashRegister.operator_name,
        opened_by_user_id: cashRegister.opened_by_user_id?.toString(),
        user_id: cashRegister.user_id.toString(),
        opening_amount: cashRegister.opening_amount,
        closing_amount: cashRegister.closing_amount,
        expected_amount: cashRegister.expected_amount,
        difference: cashRegister.difference,
        opened_at: cashRegister.opened_at.toISOString(),
        closed_at: cashRegister.closed_at?.toISOString(),
        status: cashRegister.status,
        notes: cashRegister.notes,
      },
      salesCash: Number(salesCash.toFixed(2)),
      salesCard: Number(salesCard.toFixed(2)),
      salesTransfer: Number(salesTransfer.toFixed(2)),
      totalSales: Number((salesCash + salesCard + salesTransfer).toFixed(2)),
      totalMovements: Number(totalMovements.toFixed(2)),
      expectedAmount,
      salesCount: sales.length,
      movementsCount: movements.length,
    }
  } catch (error) {
    console.error("Error al obtener resumen de caja:", error)
    return null
  }
}

/**
 * Cierra la caja registradora activa
 */
export async function closeCashRegister(data: CloseCashRegisterData) {
  try {
    await connectDB()

    const session = await getSession()
    const userId = session?.id
    const validUserId = isValidObjectId(userId) ? userId : undefined

    const cashRegister = await CashRegister.findOne({ status: "open" })
    if (!cashRegister) {
      return {
        success: false,
        error: "No hay una caja abierta para cerrar",
      }
    }

    // Obtener resumen para calcular expected_amount
    const summary = await getCashRegisterSummary(cashRegister._id.toString())
    if (!summary) {
      return {
        success: false,
        error: "Error al calcular resumen de caja",
      }
    }

    cashRegister.closing_amount = data.closing_amount
    cashRegister.expected_amount = summary.expectedAmount
    cashRegister.difference = Number(
      (data.closing_amount - summary.expectedAmount).toFixed(2)
    )
    cashRegister.closed_at = new Date()
    cashRegister.status = "closed"
    cashRegister.notes = data.notes
    cashRegister.closed_by_user_id = validUserId

    await cashRegister.save()

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard/pos")

    return {
      success: true,
      result: {
        expected_amount: summary.expectedAmount,
        closing_amount: data.closing_amount,
        difference: cashRegister.difference,
      },
    }
  } catch (error: any) {
    console.error("Error al cerrar caja:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al cerrar caja",
    }
  }
}

/**
 * Obtiene el historial de cajas con filtros y paginación
 */
export async function getCashRegisterHistory(filters: CashRegisterHistoryFilters = {}) {
  try {
    await connectDB()

    const { operator_name, start_date, end_date, status = "all", page = 1, limit = 10 } = filters

    // Construir query
    const query: any = {}

    if (operator_name) {
      query.operator_name = { $regex: operator_name, $options: "i" }
    }

    if (status !== "all") {
      query.status = status
    }

    if (start_date || end_date) {
      query.opened_at = {}
      if (start_date) {
        query.opened_at.$gte = new Date(start_date)
      }
      if (end_date) {
        const endDateObj = new Date(end_date)
        endDateObj.setHours(23, 59, 59, 999)
        query.opened_at.$lte = endDateObj
      }
    }

    const skip = (page - 1) * limit
    const total = await CashRegister.countDocuments(query)

    const cashRegisters = await CashRegister.find(query)
      .sort({ opened_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const items = cashRegisters.map((cr) => ({
      id: cr._id.toString(),
      operator_name: cr.operator_name,
      opened_by_user_id: cr.opened_by_user_id?.toString(),
      user_id: cr.user_id.toString(),
      opening_amount: cr.opening_amount,
      closing_amount: cr.closing_amount,
      expected_amount: cr.expected_amount,
      difference: cr.difference,
      opened_at: cr.opened_at.toISOString(),
      closed_at: cr.closed_at?.toISOString(),
      status: cr.status,
      notes: cr.notes,
    }))

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Error al obtener historial de cajas:", error)
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  }
}

/**
 * Obtiene el detalle completo de una caja para auditoría
 */
export async function getCashRegisterDetail(cashRegisterId: string) {
  try {
    await connectDB()

    const summary = await getCashRegisterSummary(cashRegisterId)
    if (!summary) {
      return null
    }

    // Obtener ventas con items
    const sales = await Sale.find({ cash_register_id: cashRegisterId })
      .sort({ createdAt: -1 })
      .lean()

    const salesFormatted = sales.map((sale) => ({
      id: sale._id.toString(),
      total: sale.total,
      payment_method: sale.payment_method,
      created_at: sale.createdAt.toISOString(),
      items: sale.items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
    }))

    // Obtener movimientos
    const movements = await CashMovement.find({ cash_register_id: cashRegisterId })
      .sort({ createdAt: -1 })
      .lean()

    const movementsFormatted = movements.map((mov) => ({
      id: mov._id.toString(),
      type: mov.type,
      amount: mov.amount,
      description: mov.description,
      supplier_name: mov.supplier_name,
      reference_number: mov.reference_number,
      created_by_name: mov.created_by_name,
      created_at: mov.createdAt.toISOString(),
    }))

    // Agrupar productos vendidos
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

    const productsArray = Object.values(productsSold).sort((a, b) => b.total - a.total)

    return {
      summary,
      sales: salesFormatted,
      movements: movementsFormatted,
      products: productsArray,
    }
  } catch (error) {
    console.error("Error al obtener detalle de caja:", error)
    return null
  }
}
