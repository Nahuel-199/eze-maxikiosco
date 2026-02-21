import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { UserManagement } from "@/components/user-management"

export default async function UsuariosPage() {
  const session = await getSession()

  if (session.role !== "admin") {
    redirect("/dashboard")
  }

  return <UserManagement />
}
