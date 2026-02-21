"use server"

import { connectDB } from "@/lib/db"
import { Product, Category, Sale, CashRegister } from "@/lib/models"

export interface PeriodStat {
  count: number
  total: number
}

export interface DashboardStats {
  activeProducts: number
  activeCategories: number
  periodStats: {
    today: PeriodStat
    week: PeriodStat
    month: PeriodStat
  }
}

export interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface LowStockProduct {
  id: string
  name: string
  stock: number
  minStock: number
  categoryName: string
}

export interface UnsoldProduct {
  id: string
  name: string
  stock: number
  price: number
  categoryName: string
}

export interface RecentClosing {
  id: string
  operatorName: string
  closedAt: string
  openingAmount: number
  closingAmount: number
  expectedAmount: number
  difference: number
  salesCount: number
  salesTotal: number
}

export interface DashboardData {
  stats: DashboardStats
  topProducts: TopProduct[]
  lowStockProducts: LowStockProduct[]
  unsoldProducts: UnsoldProduct[]
  recentClosings: RecentClosing[]
}

export async function getDashboardData(): Promise<DashboardData> {
  await connectDB()

  const now = new Date()

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const startOfWeek = new Date(now)
  const dayOfWeek = startOfWeek.getDay()
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const salesAggByPeriod = (since: Date) =>
    Sale.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$total" },
        },
      },
    ])

  const [
    activeProducts,
    activeCategories,
    salesTodayAgg,
    salesWeekAgg,
    salesMonthAgg,
    topProductsAgg,
    lowStockProducts,
    soldProductIds,
    recentClosingsData,
  ] = await Promise.all([
    // Active products count
    Product.countDocuments({ active: true }),

    // Active categories count
    Category.countDocuments({ active: true }),

    // Period sales stats
    salesAggByPeriod(startOfDay),
    salesAggByPeriod(startOfWeek),
    salesAggByPeriod(startOfMonth),

    // Top 10 products by quantity sold (all time)
    Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          productName: { $first: "$items.product_name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]),

    // Low stock products
    Product.find({
      active: true,
      $expr: { $lte: ["$stock", "$min_stock"] },
    })
      .populate("category_id", "name")
      .sort({ stock: 1 })
      .limit(20)
      .lean(),

    // IDs of products that have been sold
    Sale.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product_id" } },
    ]),

    // Recent closed registers
    CashRegister.find({ status: "closed" })
      .sort({ closed_at: -1 })
      .limit(5)
      .lean(),
  ])

  // Products never sold
  const soldIds = soldProductIds.map((s: { _id: string }) => s._id)
  const unsoldProductsData = await Product.find({
    _id: { $nin: soldIds },
    active: true,
  })
    .populate("category_id", "name")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  // Sales aggregate per cash register for recent closings
  const closingIds = recentClosingsData.map((c: { _id: string }) => c._id)
  const salesByCashRegister = await Sale.aggregate([
    { $match: { cash_register_id: { $in: closingIds } } },
    {
      $group: {
        _id: "$cash_register_id",
        salesCount: { $sum: 1 },
        salesTotal: { $sum: "$total" },
      },
    },
  ])

  const salesByRegisterMap = new Map(
    salesByCashRegister.map((s: { _id: string; salesCount: number; salesTotal: number }) => [
      s._id.toString(),
      s,
    ])
  )

  const todayStats = salesTodayAgg[0] || { count: 0, total: 0 }
  const weekStats = salesWeekAgg[0] || { count: 0, total: 0 }
  const monthStats = salesMonthAgg[0] || { count: 0, total: 0 }

  const stats: DashboardStats = {
    activeProducts,
    activeCategories,
    periodStats: {
      today: { count: todayStats.count, total: Number(todayStats.total.toFixed(2)) },
      week: { count: weekStats.count, total: Number(weekStats.total.toFixed(2)) },
      month: { count: monthStats.count, total: Number(monthStats.total.toFixed(2)) },
    },
  }

  const topProducts: TopProduct[] = topProductsAgg.map(
    (p: { _id: string; productName: string; totalQuantity: number; totalRevenue: number }) => ({
      productId: p._id.toString(),
      productName: p.productName,
      totalQuantity: p.totalQuantity,
      totalRevenue: Number(p.totalRevenue.toFixed(2)),
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStock: LowStockProduct[] = lowStockProducts.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    stock: p.stock,
    minStock: p.min_stock,
    categoryName: p.category_id?.name || "Sin categoría",
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsold: UnsoldProduct[] = unsoldProductsData.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    stock: p.stock,
    price: p.price,
    categoryName: p.category_id?.name || "Sin categoría",
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentClosings: RecentClosing[] = recentClosingsData.map((c: any) => {
    const salesData = salesByRegisterMap.get(c._id.toString()) || {
      salesCount: 0,
      salesTotal: 0,
    }
    return {
      id: c._id.toString(),
      operatorName: c.operator_name,
      closedAt: c.closed_at?.toISOString() || "",
      openingAmount: c.opening_amount,
      closingAmount: c.closing_amount || 0,
      expectedAmount: c.expected_amount || 0,
      difference: c.difference || 0,
      salesCount: salesData.salesCount,
      salesTotal: Number(salesData.salesTotal.toFixed(2)),
    }
  })

  return {
    stats,
    topProducts,
    lowStockProducts: lowStock,
    unsoldProducts: unsold,
    recentClosings,
  }
}
