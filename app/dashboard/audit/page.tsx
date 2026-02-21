import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AuditPanel } from "@/components/audit-panel"

export default async function AuditPage() {
  const session = await getSession()

  if (session.role !== "admin") {
    redirect("/dashboard")
  }

  return <AuditPanel />
}
