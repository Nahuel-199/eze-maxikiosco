import { getSession } from "@/lib/auth"
import { getSalesHistory } from "@/lib/actions/sales-history"
import { SalesReports } from "@/components/sales-reports"

export default async function ReportsPage() {
  await getSession()

  const initialData = await getSalesHistory({ page: 1, limit: 20 })

  return <SalesReports initialData={initialData} />
}
