import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardNav } from "@/components/dashboard-nav"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={session} />
      <DashboardNav user={session} />
      <main className="lg:pl-16">{children}</main>
    </div>
  )
}
