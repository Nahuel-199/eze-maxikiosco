"use server"

import { connectDB } from "@/lib/db"
import { Sale } from "@/lib/models"

export interface SalesHistoryFilters {
  start_date?: string
  end_date?: string
  payment_method?: "cash" | "card" | "transfer" | "all"
  product_name?: string
  page?: number
  limit?: number
}

export interface SaleHistoryItem {
  id: string
  total: number
  payment_method: "cash" | "card" | "transfer"
  items: {
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }[]
  createdAt: string
}

export interface SalesHistorySummary {
  totalAmount: number
  count: number
  avgTicket: number
  productsSold: number
}

export interface SalesHistoryResult {
  items: SaleHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: SalesHistorySummary
}

function buildMatchStage(filters: SalesHistoryFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: Record<string, any> = {}

  if (filters.start_date) {
    match.createdAt = { ...match.createdAt, $gte: new Date(filters.start_date) }
  }

  if (filters.end_date) {
    const endDate = new Date(filters.end_date)
    endDate.setHours(23, 59, 59, 999)
    match.createdAt = { ...match.createdAt, $lte: endDate }
  }

  if (filters.payment_method && filters.payment_method !== "all") {
    match.payment_method = filters.payment_method
  }

  if (filters.product_name && filters.product_name.trim()) {
    match["items.product_name"] = {
      $regex: filters.product_name.trim(),
      $options: "i",
    }
  }

  return match
}

export async function getSalesHistory(
  filters: SalesHistoryFilters = {}
): Promise<SalesHistoryResult> {
  await connectDB()

  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const match = buildMatchStage(filters)

  const [salesData, countResult, summaryResult] = await Promise.all([
    Sale.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Sale.countDocuments(match),

    Sale.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$items.subtotal" },
          productsSold: { $sum: "$items.quantity" },
          saleIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          totalAmount: 1,
          productsSold: 1,
          count: { $size: "$saleIds" },
        },
      },
    ]),
  ])

  const summary = summaryResult[0] || {
    totalAmount: 0,
    count: 0,
    productsSold: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: SaleHistoryItem[] = salesData.map((sale: any) => ({
    id: sale._id.toString(),
    total: Number(sale.total.toFixed(2)),
    payment_method: sale.payment_method,
    items: sale.items.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price.toFixed(2)),
      subtotal: Number(item.subtotal.toFixed(2)),
    })),
    createdAt: sale.createdAt.toISOString(),
  }))

  return {
    items,
    pagination: {
      page,
      limit,
      total: countResult,
      totalPages: Math.ceil(countResult / limit),
    },
    summary: {
      totalAmount: Number((summary.totalAmount || 0).toFixed(2)),
      count: summary.count || 0,
      avgTicket:
        summary.count > 0
          ? Number(((summary.totalAmount || 0) / summary.count).toFixed(2))
          : 0,
      productsSold: summary.productsSold || 0,
    },
  }
}

export interface SaleExportRow {
  date: string
  time: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  payment_method: string
  sale_total: number
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
}

export async function getSalesForExport(
  filters: SalesHistoryFilters = {}
): Promise<SaleExportRow[]> {
  await connectDB()

  const match = buildMatchStage(filters)

  const sales = await Sale.find(match)
    .sort({ createdAt: -1 })
    .lean()

  const rows: SaleExportRow[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const sale of sales as any[]) {
    const dateObj = new Date(sale.createdAt)
    const date = dateObj.toLocaleDateString("es-AR")
    const time = dateObj.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    for (const item of sale.items) {
      rows.push({
        date,
        time,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price.toFixed(2)),
        subtotal: Number(item.subtotal.toFixed(2)),
        payment_method:
          PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method,
        sale_total: Number(sale.total.toFixed(2)),
      })
    }
  }

  return rows
}
