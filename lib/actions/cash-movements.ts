"use server"

import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { CashMovement, CashRegister } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import type { CashMovement as CashMovementType, CashMovementType as MovementType } from "@/lib/types"

/**
 * Valida si un string es un ObjectId válido de MongoDB
 */
function isValidObjectId(id: string | undefined): boolean {
  if (!id) return false
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

export interface CreateCashMovementData {
  type: MovementType
  amount: number
  description: string
  supplier_name?: string
  reference_number?: string
  created_by_name: string
}

/**
 * Crea un nuevo movimiento de caja (egreso)
 */
export async function createCashMovement(data: CreateCashMovementData) {
  try {
    await connectDB()

    const session = await getSession()
    const userId = session?.id
    const validUserId = isValidObjectId(userId) ? userId : undefined

    // Obtener la caja activa
    const cashRegister = await CashRegister.findOne({ status: "open" })
    if (!cashRegister) {
      return {
        success: false,
        error: "No hay una caja abierta. Debe abrir una caja antes de registrar movimientos.",
      }
    }

    const movement = await CashMovement.create({
      cash_register_id: cashRegister._id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      supplier_name: data.supplier_name || undefined,
      reference_number: data.reference_number || undefined,
      created_by_name: data.created_by_name,
      created_by_user_id: validUserId,
    })

    revalidatePath("/dashboard/cash-register")

    return {
      success: true,
      movement: {
        id: movement._id.toString(),
        type: movement.type,
        amount: movement.amount,
        description: movement.description,
      },
    }
  } catch (error: any) {
    console.error("Error al crear movimiento:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ")
      return { success: false, error: messages }
    }

    return {
      success: false,
      error: error.message || "Error al crear movimiento",
    }
  }
}

/**
 * Obtiene los movimientos de una caja específica
 */
export async function getCashMovements(cashRegisterId: string): Promise<CashMovementType[]> {
  try {
    await connectDB()

    const movements = await CashMovement.find({ cash_register_id: cashRegisterId })
      .sort({ createdAt: -1 })
      .lean()

    return movements.map((mov) => ({
      id: mov._id.toString(),
      cash_register_id: mov.cash_register_id.toString(),
      type: mov.type,
      amount: mov.amount,
      description: mov.description,
      supplier_name: mov.supplier_name,
      reference_number: mov.reference_number,
      created_by_name: mov.created_by_name,
      created_by_user_id: mov.created_by_user_id?.toString(),
      created_at: mov.createdAt.toISOString(),
      updated_at: mov.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error al obtener movimientos:", error)
    return []
  }
}

/**
 * Obtiene los movimientos de la caja activa
 */
export async function getActiveRegisterMovements(): Promise<CashMovementType[]> {
  try {
    await connectDB()

    const cashRegister = await CashRegister.findOne({ status: "open" })
    if (!cashRegister) {
      return []
    }

    return getCashMovements(cashRegister._id.toString())
  } catch (error) {
    console.error("Error al obtener movimientos de caja activa:", error)
    return []
  }
}

/**
 * Elimina un movimiento (solo admin)
 */
export async function deleteCashMovement(movementId: string) {
  try {
    await connectDB()

    const session = await getSession()
    if (!session || session.role !== "admin") {
      return {
        success: false,
        error: "Solo los administradores pueden eliminar movimientos",
      }
    }

    const movement = await CashMovement.findById(movementId)
    if (!movement) {
      return {
        success: false,
        error: "Movimiento no encontrado",
      }
    }

    // Verificar que la caja sigue abierta
    const cashRegister = await CashRegister.findById(movement.cash_register_id)
    if (!cashRegister || cashRegister.status !== "open") {
      return {
        success: false,
        error: "No se puede eliminar un movimiento de una caja cerrada",
      }
    }

    await movement.deleteOne()

    revalidatePath("/dashboard/cash-register")

    return {
      success: true,
      message: "Movimiento eliminado correctamente",
    }
  } catch (error: any) {
    console.error("Error al eliminar movimiento:", error)
    return {
      success: false,
      error: error.message || "Error al eliminar movimiento",
    }
  }
}
