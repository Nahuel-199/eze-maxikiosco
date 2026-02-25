import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/features"
import { getSalesHistory } from "@/lib/actions/sales-history"
import { SalesReports } from "@/components/sales-reports"

export default async function ReportsPage() {
  if (!isFeatureEnabled("reports")) redirect("/dashboard")

  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.REPORTS_VIEW)) {
    redirect("/dashboard/pos")
  }

  const initialData = await getSalesHistory({ page: 1, limit: 20 })

  return <SalesReports initialData={initialData} />
}
