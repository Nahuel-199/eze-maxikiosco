import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isFeatureEnabled } from "@/lib/features"
import { UserManagement } from "@/components/user-management"

export default async function UsuariosPage() {
  if (!isFeatureEnabled("users")) redirect("/dashboard")

  const session = await getSession()

  if (session.role !== "admin") {
    redirect("/dashboard")
  }

  return <UserManagement />
}
