import * as XLSX from "xlsx"
import type { SaleExportRow } from "@/lib/actions/sales-history"

export function exportSalesToExcel(rows: SaleExportRow[], filename: string) {
  const data = rows.map((row) => ({
    Fecha: row.date,
    Hora: row.time,
    Producto: row.product_name,
    Cantidad: row.quantity,
    "Precio Unit.": row.unit_price,
    Subtotal: row.subtotal,
    "Método de Pago": row.payment_method,
    "Total Venta": row.sale_total,
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 8 },  // Hora
    { wch: 30 }, // Producto
    { wch: 10 }, // Cantidad
    { wch: 12 }, // Precio Unit.
    { wch: 12 }, // Subtotal
    { wch: 16 }, // Método de Pago
    { wch: 12 }, // Total Venta
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas")

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
