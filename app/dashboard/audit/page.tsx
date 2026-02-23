import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { AuditPanel } from "@/components/audit-panel"

export default async function AuditPage() {
  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.AUDIT_VIEW)) {
    redirect("/dashboard")
  }

  return <AuditPanel />
}
