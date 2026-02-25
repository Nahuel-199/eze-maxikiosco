import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/features"
import { AuditPanel } from "@/components/audit-panel"

export default async function AuditPage() {
  if (!isFeatureEnabled("audit")) redirect("/dashboard")

  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.AUDIT_VIEW)) {
    redirect("/dashboard")
  }

  return <AuditPanel />
}
