"use server"

import { connectDB } from "@/lib/db"
import { AuditLog } from "@/lib/models"
import type { AuditAction, AuditEntityType, IAuditLogChange } from "@/lib/models"
import { requirePermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export interface CreateAuditLogData {
  user_id: string
  user_name: string
  user_email: string
  action: AuditAction
  entity_type: AuditEntityType
  entity_name: string
  entity_id: string
  changes?: IAuditLogChange[]
}

/**
 * Registra una entrada en el log de auditoría.
 * Se llama internamente desde otras server actions.
 */
export async function createAuditLog(data: CreateAuditLogData) {
  try {
    await connectDB()

    await AuditLog.create({
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      action: data.action,
      entity_type: data.entity_type,
      entity_name: data.entity_name,
      entity_id: data.entity_id,
      changes: data.changes || [],
    })
  } catch (error) {
    console.error("Error al registrar auditoría:", error)
  }
}

export interface GetAuditLogsOptions {
  page?: number
  limit?: number
  user_id?: string
  action?: AuditAction | ""
  entity_type?: AuditEntityType | ""
  search?: string
  start_date?: string
  end_date?: string
}

export interface AuditLogEntry {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: AuditAction
  entity_type: AuditEntityType
  entity_name: string
  entity_id: string
  changes: IAuditLogChange[]
  createdAt: string
}

export interface GetAuditLogsResult {
  items: AuditLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    creates: number
    updates: number
    deletes: number
    stock_updates: number
  }
}

/**
 * Obtiene logs de auditoría con paginación y filtros.
 * Requiere permiso audit:view.
 */
export async function getAuditLogs(options: GetAuditLogsOptions = {}): Promise<GetAuditLogsResult> {
  const auth = await requirePermission(PERMISSIONS.AUDIT_VIEW)
  if (auth.error) throw new Error(auth.error)

  await connectDB()

  const {
    page = 1,
    limit = 20,
    user_id,
    action,
    entity_type,
    search,
    start_date,
    end_date,
  } = options

  const filter: any = {}

  if (user_id) {
    filter.user_id = user_id
  }

  if (action) {
    filter.action = action
  }

  if (entity_type) {
    filter.entity_type = entity_type
  }

  if (search?.trim()) {
    filter.entity_name = new RegExp(search.trim(), "i")
  }

  if (start_date || end_date) {
    filter.createdAt = {}
    if (start_date) {
      filter.createdAt.$gte = new Date(start_date)
    }
    if (end_date) {
      const endDateObj = new Date(end_date)
      endDateObj.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = endDateObj
    }
  }

  const [total, items, statsAgg] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
    ]),
  ])

  const statsMap: Record<string, number> = {}
  for (const s of statsAgg) {
    statsMap[s._id] = s.count
  }

  const serializedItems: AuditLogEntry[] = items.map((item) => ({
    id: item._id.toString(),
    user_id: item.user_id.toString(),
    user_name: item.user_name,
    user_email: item.user_email,
    action: item.action,
    entity_type: item.entity_type,
    entity_name: item.entity_name,
    entity_id: item.entity_id.toString(),
    changes: item.changes || [],
    createdAt: item.createdAt.toISOString(),
  }))

  return {
    items: serializedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total: (statsMap.create || 0) + (statsMap.update || 0) + (statsMap.delete || 0) + (statsMap.stock_update || 0),
      creates: statsMap.create || 0,
      updates: statsMap.update || 0,
      deletes: statsMap.delete || 0,
      stock_updates: statsMap.stock_update || 0,
    },
  }
}
